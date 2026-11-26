<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Auction;
use App\Models\AuditLog;
use App\Models\DamageDetection;
use App\Models\Inspection;
use App\Models\User;
use App\Models\Valuation;
use App\Models\Vehicle;
use App\Services\ValuationService;
use App\Services\VinDecoderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class VehicleController extends Controller
{
    public function __construct(
        private VinDecoderService $vinDecoder,
        private ValuationService $valuationService
    ) {}

    public function decodeVin(string $vin): JsonResponse
    {
        $check = $this->vinDecoder->validate($vin);
        if (! $check['valid']) {
            return response()->json(['error' => $check['error']], 400);
        }

        return response()->json(['decoded' => $this->vinDecoder->decode($check['normalized'])]);
    }

    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->attributes->get('auth_user');

        $query = Vehicle::with(['tenant', 'inspection.damages', 'valuation'])->orderByDesc('created_at');
        if ($user->role !== 'PLATFORM_ADMIN') {
            $query->where('tenant_id', $user->tenant_id);
        }

        if ($q = trim((string) $request->query('q', ''))) {
            $like = '%'.strtolower($q).'%';
            $query->where(function ($sub) use ($like) {
                $sub->whereRaw('LOWER(vin) LIKE ?', [$like])
                    ->orWhereRaw('LOWER(make) LIKE ?', [$like])
                    ->orWhereRaw('LOWER(model) LIKE ?', [$like]);
            });
        }
        if (($status = (string) $request->query('status', 'ALL')) !== 'ALL') {
            $query->where('status', $status);
        }
        if (($make = (string) $request->query('make', 'ALL')) !== 'ALL') {
            $query->where('make', $make);
        }

        return response()->json([
            'vehicles' => $query->get()->map(fn (Vehicle $v) => $v->toApiArray())->values(),
        ]);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->attributes->get('auth_user');
        $vehicle = Vehicle::with(['tenant', 'inspection.damages', 'valuation'])->find($id);
        if (! $vehicle) {
            return response()->json(['error' => 'Vehicle not found'], 404);
        }

        $isPublicAuction = Auction::where('vehicle_id', $vehicle->id)
            ->whereIn('status', ['LIVE', 'EXTENDED', 'SCHEDULED', 'SOLD'])
            ->exists();

        if ($user->role !== 'PLATFORM_ADMIN' && $vehicle->tenant_id !== $user->tenant_id && ! $isPublicAuction) {
            AuditLog::create([
                'id' => 'aud-'.Str::lower(Str::random(8)),
                'tenant_id' => $user->tenant_id,
                'actor_name' => $user->full_name,
                'actor_role' => $user->role,
                'action' => 'SECURITY_CROSS_TENANT_BLOCKED',
                'resource' => "GET /api/vehicles/{$vehicle->id}",
                'severity' => 'SECURITY',
                'details' => "Blocked cross-tenant access to {$vehicle->tenant?->name} vehicle {$vehicle->vin}.",
            ]);

            return response()->json(['error' => 'Forbidden: cross-tenant vehicle access denied (REQ-1.3).'], 403);
        }

        return response()->json(['vehicle' => $vehicle->toApiArray()]);
    }

    public function store(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->attributes->get('auth_user');

        $data = $request->validate([
            'vin' => ['required', 'string', 'size:17'],
            'make' => ['required', 'string'],
            'model' => ['required', 'string'],
            'year' => ['required', 'integer', 'min:1990', 'max:2027'],
            'bodyType' => ['nullable', 'string'],
            'engine' => ['nullable', 'string'],
            'fuel' => ['nullable', 'string'],
            'transmission' => ['nullable', 'string'],
            'color' => ['nullable', 'string'],
            'mileageKm' => ['required', 'integer', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);

        $check = $this->vinDecoder->validate($data['vin']);
        if (! $check['valid']) {
            return response()->json(['error' => $check['error']], 400);
        }

        $existing = Vehicle::where('tenant_id', $user->tenant_id)
            ->where('vin', $check['normalized'])
            ->first();
        if ($existing) {
            return response()->json(['vehicle' => $existing->toApiArray(), 'existing' => true]);
        }

        $vehicle = Vehicle::create([
            'id' => 'veh-'.Str::lower(Str::random(8)),
            'tenant_id' => $user->tenant_id,
            'vin' => $check['normalized'],
            'make' => $data['make'],
            'model' => $data['model'],
            'year' => $data['year'],
            'body_type' => $data['bodyType'] ?? 'Hatchback',
            'engine' => $data['engine'] ?? '1.6L',
            'fuel' => $data['fuel'] ?? 'Petrol',
            'transmission' => $data['transmission'] ?? 'Automatic',
            'color' => $data['color'] ?? 'Metallic Grey',
            'mileage_km' => $data['mileageKm'],
            'status' => 'REGISTERED',
            'notes' => $data['notes'] ?? '',
            'image_accent' => '#1e3a5f',
        ]);

        AuditLog::create([
            'id' => 'aud-'.Str::lower(Str::random(8)),
            'tenant_id' => $user->tenant_id,
            'actor_name' => $user->full_name,
            'actor_role' => $user->role,
            'action' => 'VEHICLE_REGISTERED',
            'resource' => "{$vehicle->vin} ({$vehicle->make} {$vehicle->model})",
            'severity' => 'INFO',
            'details' => 'Registered with '.number_format($vehicle->mileage_km).' km.',
        ]);

        return response()->json(['vehicle' => $vehicle->toApiArray()], 201);
    }

    public function completeInspection(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->attributes->get('auth_user');

        $data = $request->validate([
            'vehicleId' => ['required', 'string'],
            'notes' => ['nullable', 'string'],
            'plateBlurEnabled' => ['boolean'],
            'inferenceTimeSec' => ['numeric'],
            'checklist' => ['required', 'array'],
            'damages' => ['array'],
        ]);

        $vehicle = Vehicle::where('id', $data['vehicleId'])
            ->where('tenant_id', $user->tenant_id)
            ->first();
        if (! $vehicle) {
            return response()->json(['error' => 'Vehicle not found in tenant'], 404);
        }

        $now = Carbon::now();
        $inspection = Inspection::create([
            'id' => 'insp-'.Str::lower(Str::random(8)),
            'tenant_id' => $user->tenant_id,
            'vehicle_id' => $vehicle->id,
            'inspector_id' => $user->id,
            'inspector_name' => $user->full_name,
            'status' => 'FINALIZED',
            'model_version' => 'yolov8s-drivehub-v1.4',
            'inference_time_sec' => $data['inferenceTimeSec'] ?? 3.1,
            'plate_blur_enabled' => $data['plateBlurEnabled'] ?? true,
            'notes' => $data['notes'] ?? '',
            'checklist' => $data['checklist'],
            'submitted_at' => $now,
            'finalized_at' => $now,
        ]);

        $damages = $data['damages'] ?? [];
        foreach ($damages as $d) {
            DamageDetection::create([
                'id' => 'dmg-'.Str::lower(Str::random(8)),
                'tenant_id' => $user->tenant_id,
                'inspection_id' => $inspection->id,
                'angle' => $d['angle'] ?? 'right',
                'panel' => $d['panel'] ?? 'Exterior panel',
                'type' => $d['type'] ?? 'SCRATCH',
                'confidence' => $d['confidence'] ?? 0.85,
                'bbox' => $d['bbox'] ?? ['x' => 40, 'y' => 40, 'width' => 15, 'height' => 15],
                'source' => $d['source'] ?? 'AI',
                'confirmed_by_inspector' => $d['confirmedByInspector'] ?? true,
                'estimated_deduction_gbp' => $d['estimatedDeductionGbp'] ?? 200,
            ]);
        }

        $calc = $this->valuationService->calculate(
            $vehicle->make,
            (int) $vehicle->year,
            (int) $vehicle->mileage_km,
            $damages
        );

        Valuation::create([
            'id' => 'val-'.Str::lower(Str::random(8)),
            'tenant_id' => $user->tenant_id,
            'vehicle_id' => $vehicle->id,
            'inspection_id' => $inspection->id,
            'suggested_price' => $calc['suggestedPrice'],
            'min_price' => $calc['minPrice'],
            'max_price' => $calc['maxPrice'],
            'model_version' => $calc['modelVersion'],
            'factors' => $calc['factors'],
        ]);

        $vehicle->status = 'IN_STOCK';
        $vehicle->save();

        AuditLog::create([
            'id' => 'aud-'.Str::lower(Str::random(8)),
            'tenant_id' => $user->tenant_id,
            'actor_name' => $user->full_name,
            'actor_role' => $user->role,
            'action' => 'INSPECTION_FINALIZED',
            'resource' => "{$vehicle->vin} ({$vehicle->make} {$vehicle->model})",
            'severity' => 'INFO',
            'details' => "Finalized YOLOv8 report. AI Valuation £{$calc['suggestedPrice']}.",
        ]);

        return response()->json(['vehicle' => $vehicle->fresh()->toApiArray()]);
    }

    public function overridePrice(Request $request, string $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->attributes->get('auth_user');

        $data = $request->validate([
            'overriddenPrice' => ['required', 'integer', 'min:500', 'max:500000'],
            'reason' => ['required', 'string', 'min:5'],
        ]);

        $vehicle = Vehicle::with('valuation')->find($id);
        if (! $vehicle || ($user->role !== 'PLATFORM_ADMIN' && $vehicle->tenant_id !== $user->tenant_id)) {
            return response()->json(['error' => 'Forbidden'], 403);
        }
        if (! $vehicle->valuation) {
            return response()->json(['error' => 'Vehicle must be valued first'], 400);
        }

        $val = $vehicle->valuation;
        $val->overridden_price = $data['overriddenPrice'];
        $val->override_reason = $data['reason'];
        $val->overridden_by = $user->full_name;
        $val->overridden_at = Carbon::now();
        $val->save();

        AuditLog::create([
            'id' => 'aud-'.Str::lower(Str::random(8)),
            'tenant_id' => $user->tenant_id,
            'actor_name' => $user->full_name,
            'actor_role' => $user->role,
            'action' => 'VALUATION_OVERRIDDEN',
            'resource' => $vehicle->vin,
            'severity' => 'WARNING',
            'details' => "Overrode AI price £{$val->suggested_price} → £{$val->overridden_price}. Reason: {$val->override_reason}",
        ]);

        return response()->json(['vehicle' => $vehicle->fresh()->toApiArray()]);
    }
}

