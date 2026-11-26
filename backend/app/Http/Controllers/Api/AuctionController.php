<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Auction;
use App\Models\AuditLog;
use App\Models\User;
use App\Models\Vehicle;
use App\Services\AtomicAuctionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class AuctionController extends Controller
{
    public function __construct(private AtomicAuctionService $auctionService) {}

    private function settleExpiredAuctions(): void
    {
        $expired = Auction::whereIn('status', ['LIVE', 'EXTENDED'])
            ->where('ends_at', '<=', Carbon::now())
            ->get();

        foreach ($expired as $auction) {
            $this->auctionService->closeAuction($auction);
        }
    }

    public function index(Request $request): JsonResponse
    {
        $this->settleExpiredAuctions();
        /** @var User $user */
        $user = $request->attributes->get('auth_user');

        $auctions = Auction::with(['tenant', 'vehicle.inspection.damages', 'vehicle.valuation', 'bids', 'sale'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'auctions' => $auctions->map(fn (Auction $a) => [
                'auction' => $a->toApiArrayFor($user->role, $user->tenant_id),
                'vehicle' => $a->vehicle?->toApiArray(),
            ])->values(),
        ]);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $this->settleExpiredAuctions();
        /** @var User $user */
        $user = $request->attributes->get('auth_user');
        $auction = Auction::with(['tenant', 'vehicle.inspection.damages', 'vehicle.valuation', 'bids', 'sale'])->find($id);

        if (! $auction) {
            return response()->json(['error' => 'Auction not found'], 404);
        }

        return response()->json([
            'auction' => $auction->toApiArrayFor($user->role, $user->tenant_id),
            'vehicle' => $auction->vehicle?->toApiArray(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->attributes->get('auth_user');

        $data = $request->validate([
            'vehicleId' => ['required', 'string'],
            'startPrice' => ['required', 'integer', 'min:500'],
            'reservePrice' => ['required', 'integer', 'min:500'],
            'minIncrement' => ['integer', 'min:50'],
            'durationMinutes' => ['integer', 'min:1', 'max:120'],
            'visibility' => ['in:ALL_VERIFIED,INVITED_ONLY'],
            'launchImmediately' => ['boolean'],
        ]);

        if ($data['reservePrice'] < $data['startPrice']) {
            return response()->json(['error' => 'Reserve price must be >= starting price.'], 400);
        }

        $vehicle = Vehicle::with('inspection')->find($data['vehicleId']);
        if (! $vehicle || ($user->role !== 'PLATFORM_ADMIN' && $vehicle->tenant_id !== $user->tenant_id)) {
            return response()->json(['error' => 'Forbidden'], 403);
        }
        if (! $vehicle->inspection || $vehicle->inspection->status !== 'FINALIZED') {
            return response()->json(['error' => 'Vehicle inspection must be finalized before auctioning (BR-2).'], 400);
        }

        $now = Carbon::now();
        $launch = $data['launchImmediately'] ?? true;

        $auction = Auction::create([
            'id' => 'auc-'.Str::lower(Str::random(8)),
            'tenant_id' => $vehicle->tenant_id,
            'vehicle_id' => $vehicle->id,
            'start_price' => $data['startPrice'],
            'reserve_price' => $data['reservePrice'],
            'reserve_met' => false,
            'min_increment' => $data['minIncrement'] ?? 100,
            'highest_bid' => $data['startPrice'],
            'sequence_no' => 0,
            'extensions_count' => 0,
            'max_extensions' => 10,
            'visibility' => $data['visibility'] ?? 'ALL_VERIFIED',
            'starts_at' => $now,
            'ends_at' => $now->copy()->addMinutes($data['durationMinutes'] ?? 20),
            'status' => $launch ? 'LIVE' : 'SCHEDULED',
            'connected_bidders' => $launch ? 8 : 0,
        ]);

        $vehicle->status = 'IN_AUCTION';
        $vehicle->save();

        AuditLog::create([
            'id' => 'aud-'.Str::lower(Str::random(8)),
            'tenant_id' => $user->tenant_id,
            'actor_name' => $user->full_name,
            'actor_role' => $user->role,
            'action' => 'AUCTION_PUBLISHED',
            'resource' => "{$auction->id} ({$vehicle->make} {$vehicle->model})",
            'severity' => 'INFO',
            'details' => "Start £{$auction->start_price}, Hidden Reserve £{$auction->reserve_price}, Status {$auction->status}.",
        ]);

        return response()->json([
            'auction' => $auction->toApiArrayFor($user->role, $user->tenant_id),
            'vehicle' => $vehicle->toApiArray(),
        ], 201);
    }

    public function placeBid(Request $request, string $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->attributes->get('auth_user');

        $data = $request->validate([
            'amount' => ['required', 'integer', 'min:1'],
            'clientRequestId' => ['required', 'string', 'min:3'],
        ]);

        $outcome = $this->auctionService->placeBid(
            $id,
            $user,
            (int) $data['amount'],
            (string) $data['clientRequestId']
        );

        if ($outcome['accepted']) {
            return response()->json([
                'accepted' => true,
                'bid' => $outcome['bid'],
                'extended' => $outcome['extended'],
            ]);
        }

        return response()->json([
            'accepted' => false,
            'bid' => $outcome['bid'] ?? null,
            'error' => $outcome['reason'] ?? 'REJECTED',
            'reason' => $outcome['reason'] ?? 'REJECTED',
        ], $outcome['statusCode'] ?? 409);
    }
}

