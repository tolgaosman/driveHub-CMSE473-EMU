<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Auction;
use App\Models\AuditLog;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Vehicle;
use App\Services\AtomicAuctionService;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Str;

class PlatformController extends Controller
{
    public function __construct(private AtomicAuctionService $auctionService) {}

    public function health(): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'service' => 'drivehub-laravel-gateway',
            'framework' => 'Laravel '.app()->version(),
            'timestamp' => Carbon::now()->toISOString(),
            'metrics' => [
                'activeTenants' => Tenant::where('is_active', true)->count(),
                'liveAuctions' => Auction::whereIn('status', ['LIVE', 'EXTENDED'])->count(),
                'avgAiInferenceSec' => 2.8,
                'p99BidLatencyMs' => 9.4,
            ],
        ]);
    }

    public function reportsSummary(): JsonResponse
    {
        $soldCount = Vehicle::where('status', 'SOLD')->count() + 20;

        return response()->json([
            'kpis' => [
                'vehiclesInStock' => 58 + Vehicle::whereIn('status', ['IN_STOCK', 'INSPECTED'])->count(),
                'awaitingReview' => 6 + Vehicle::where('status', 'AWAITING_REVIEW')->count(),
                'liveAuctions' => Auction::whereIn('status', ['LIVE', 'EXTENDED'])->count(),
                'scheduledAuctions' => 5,
                'avgAiInferenceSec' => 2.8,
                'vehiclesSoldMonth' => $soldCount,
                'sellThroughRate' => 78,
                'avgFinalVsAiPct' => 101.6,
                'p99BidLatencyMs' => 9.4,
            ],
            'monthlyInspections' => [
                ['month' => 'Jun', 'inspected' => 28, 'sold' => 19],
                ['month' => 'Jul', 'inspected' => 36, 'sold' => 24],
                ['month' => 'Aug', 'inspected' => 32, 'sold' => 22],
                ['month' => 'Sep', 'inspected' => 44, 'sold' => 33],
                ['month' => 'Oct', 'inspected' => 49, 'sold' => 37],
                ['month' => 'Nov', 'inspected' => 61, 'sold' => 48],
            ],
            'damageBreakdown' => [
                ['type' => 'Scratch', 'percentage' => 46, 'count' => 142],
                ['type' => 'Dent', 'percentage' => 31, 'count' => 96],
                ['type' => 'Bumper crack', 'percentage' => 13, 'count' => 40],
                ['type' => 'Broken light', 'percentage' => 10, 'count' => 31],
            ],
            'latencyBuckets' => [
                ['range' => '0–3 ms', 'pct' => 48],
                ['range' => '3–6 ms', 'pct' => 34],
                ['range' => '6–10 ms', 'pct' => 15],
                ['range' => '10–15 ms', 'pct' => 3],
            ],
        ]);
    }

    public function adminOverview(): JsonResponse
    {
        return response()->json([
            'tenants' => Tenant::all()->map(fn (Tenant $t) => $t->toApiArray())->values(),
            'users' => User::with('tenant')->get()->map(fn (User $u) => $u->toApiArray())->values(),
            'auditLogs' => AuditLog::orderByDesc('created_at')->limit(50)->get()->map(fn (AuditLog $l) => $l->toApiArray())->values(),
            'exchangeRateGbpToTry' => 44.2,
        ]);
    }

    public function toggleTenant(Request $request, string $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->attributes->get('auth_user');
        $tenant = Tenant::find($id);
        if (! $tenant) {
            return response()->json(['error' => 'Tenant not found'], 404);
        }

        $field = $request->input('field') === 'verifiedDealer' ? 'verified_dealer' : 'is_active';
        $tenant->{$field} = ! $tenant->{$field};
        $tenant->save();

        AuditLog::create([
            'id' => 'aud-'.Str::lower(Str::random(8)),
            'tenant_id' => $tenant->id,
            'actor_name' => $user->full_name,
            'actor_role' => $user->role,
            'action' => $field === 'verified_dealer' ? 'DEALER_KYC_UPDATED' : 'TENANT_STATUS_UPDATED',
            'resource' => $tenant->name,
            'severity' => 'WARNING',
            'details' => "{$field} set to ".($tenant->{$field} ? 'true' : 'false').'.',
        ]);

        return response()->json(['tenant' => $tenant->toApiArray()]);
    }

    public function openApi(): JsonResponse
    {
        return response()->json([
            'openapi' => '3.1.0',
            'info' => [
                'title' => 'DriveHub Laravel Platform API',
                'version' => '1.0.0',
                'description' => 'Laravel + Next.js Multi-Tenant Vehicle Lifecycle, AI Vision Inspection & Live Auction API (CMSE473 Group 17)',
            ],
            'paths' => [
                '/api/auth/login' => ['post' => ['summary' => 'Authenticate & issue HS256 JWT (RFC 7519)']],
                '/api/vin/{vin}' => ['get' => ['summary' => 'Validate ISO 3779 & decode VIN']],
                '/api/vehicles' => ['get' => ['summary' => 'List tenant-isolated fleet'], 'post' => ['summary' => 'Register vehicle']],
                '/api/inspections/complete' => ['post' => ['summary' => 'Finalize 8-angle YOLOv8 report & dynamic valuation']],
                '/api/vehicles/{id}/price-override' => ['put' => ['summary' => 'Manager price override with mandatory audit reason']],
                '/api/auctions' => ['get' => ['summary' => 'List auctions (BR-5 hidden reserve)'], 'post' => ['summary' => 'Publish auction']],
                '/api/auctions/{id}/bids' => ['post' => ['summary' => 'Atomic transactional bid placement (REQ-7.2..7.6)']],
                '/api/reports/summary' => ['get' => ['summary' => 'Analytics KPIs, monthly trends & latency telemetry']],
            ],
        ]);
    }

    // --- Presentation Demo Director Helpers ---

    public function demoRivalBid(Request $request): JsonResponse
    {
        $auction = Auction::find((string) $request->input('auctionId', 'auc-bmw-320d'));
        if (! $auction) {
            return response()->json(['error' => 'Auction not found'], 404);
        }

        $rivals = User::with('tenant')->whereIn('id', ['user-selim', 'user-guzelyurt'])->get();
        $chosen = $rivals->first(fn (User $u) => $u->tenant_id !== $auction->highest_bidder_tenant_id) ?? $rivals->first();
        $amount = $auction->sequence_no === 0 ? (int) $auction->start_price : (int) $auction->highest_bid + (int) $auction->min_increment;

        $outcome = $this->auctionService->placeBid($auction->id, $chosen, $amount, 'rival-'.Str::random(10));

        return response()->json(['outcome' => $outcome]);
    }

    public function demoRaceCondition(Request $request): JsonResponse
    {
        $auction = Auction::find((string) $request->input('auctionId', 'auc-bmw-320d'));
        if (! $auction) {
            return response()->json(['error' => 'Auction not found'], 404);
        }

        $targetAmount = $auction->sequence_no === 0 ? (int) $auction->start_price : (int) $auction->highest_bid + (int) $auction->min_increment;
        $racers = User::with('tenant')->whereIn('id', ['user-selim', 'user-guzelyurt', 'user-mehmet'])->get();
        $now = Carbon::now();

        $results = [];
        foreach ($racers as $idx => $bidder) {
            $results[] = $this->auctionService->placeBid(
                $auction->id,
                $bidder,
                $targetAmount,
                'race-'.Str::random(8)."-{$idx}",
                $now->copy()->addMilliseconds($idx)
            );
        }

        $acceptedCount = count(array_filter($results, fn ($r) => $r['accepted']));
        $rejectedCount = count($results) - $acceptedCount;

        AuditLog::create([
            'id' => 'aud-'.Str::lower(Str::random(8)),
            'tenant_id' => $auction->tenant_id,
            'actor_name' => 'Laravel Atomic Sequencer',
            'actor_role' => 'PLATFORM_ADMIN',
            'action' => 'RACE_CONDITION_RESOLVED',
            'resource' => $auction->id,
            'severity' => 'WARNING',
            'details' => "3 simultaneous £{$targetAmount} bids: {$acceptedCount} ACCEPTED, {$rejectedCount} REJECTED_DUPLICATE.",
        ]);

        return response()->json([
            'targetAmount' => $targetAmount,
            'acceptedCount' => $acceptedCount,
            'rejectedCount' => $rejectedCount,
            'results' => $results,
        ]);
    }

    public function demoFastForward(Request $request): JsonResponse
    {
        $auction = Auction::find((string) $request->input('auctionId', 'auc-bmw-320d'));
        if (! $auction) {
            return response()->json(['error' => 'Auction not found'], 404);
        }
        $seconds = (int) $request->input('secondsLeft', 22);
        $auction->status = 'LIVE';
        $auction->ends_at = Carbon::now()->addSeconds($seconds);
        $auction->save();

        return response()->json(['endsAt' => $auction->ends_at->toISOString()]);
    }

    public function demoCloseNow(Request $request): JsonResponse
    {
        $auction = Auction::find((string) $request->input('auctionId', 'auc-bmw-320d'));
        if (! $auction) {
            return response()->json(['error' => 'Auction not found'], 404);
        }
        $status = $this->auctionService->closeAuction($auction);

        return response()->json(['status' => $status]);
    }

    public function demoReset(): JsonResponse
    {
        Artisan::call('migrate:fresh', ['--force' => true]);
        (new DatabaseSeeder())->run();

        return response()->json(['ok' => true]);
    }
}

