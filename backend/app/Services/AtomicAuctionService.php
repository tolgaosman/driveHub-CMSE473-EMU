<?php

namespace App\Services;

use App\Models\Auction;
use App\Models\Bid;
use App\Models\Sale;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AtomicAuctionService
{
    /**
     * Atomic transactional bid sequencer enforcing REQ-7.2..7.6, BR-3, BR-4, REQ-6.4.
     */
    public function placeBid(
        string $auctionId,
        User $bidder,
        int $amount,
        string $clientRequestId,
        ?Carbon $now = null
    ): array {
        $startHr = hrtime(true);
        $now = $now ?? Carbon::now();

        return DB::transaction(function () use ($auctionId, $bidder, $amount, $clientRequestId, $now, $startHr) {
            /** @var Auction|null $auction */
            $auction = Auction::where('id', $auctionId)->lockForUpdate()->first();
            if (! $auction) {
                return ['accepted' => false, 'statusCode' => 404, 'reason' => 'AUCTION_NOT_FOUND'];
            }

            // REQ-7.5: Idempotency check
            $existing = Bid::where('auction_id', $auctionId)
                ->where('client_request_id', $clientRequestId)
                ->first();
            if ($existing) {
                return [
                    'accepted' => $existing->status === 'ACCEPTED' || $existing->status === 'OUTBID',
                    'statusCode' => 200,
                    'bid' => $existing->toApiArray(),
                    'extended' => false,
                    'reason' => $existing->rejection_reason,
                ];
            }

            $bidder->loadMissing('tenant');
            $alias = $bidder->tenant?->name ?? $bidder->full_name;
            $serverTs = $now->format('H:i:s.v');

            $reject = function (string $status, string $reason) use (
                $auction, $bidder, $alias, $amount, $clientRequestId, $serverTs, $startHr
            ): array {
                $procMs = max(0.4, round((hrtime(true) - $startHr) / 1_000_000, 2));
                $bid = Bid::create([
                    'id' => 'bid-rej-'.Str::lower(Str::random(8)),
                    'auction_id' => $auction->id,
                    'bidder_id' => $bidder->id,
                    'bidder_tenant_id' => $bidder->tenant_id,
                    'bidder_alias' => $alias,
                    'amount' => $amount,
                    'sequence_no' => null,
                    'status' => $status,
                    'rejection_reason' => $reason,
                    'client_request_id' => $clientRequestId,
                    'processing_ms' => $procMs,
                    'server_timestamp' => $serverTs,
                ]);

                return [
                    'accepted' => false,
                    'statusCode' => 409,
                    'bid' => $bid->toApiArray(),
                    'extended' => false,
                    'reason' => $reason,
                ];
            };

            if (! in_array($auction->status, ['LIVE', 'EXTENDED'], true) || $now->greaterThanOrEqualTo($auction->ends_at)) {
                return $reject('REJECTED_CLOSED', 'CLOSED');
            }

            // BR-3: Selling gallery cannot bid on its own vehicle
            if ($bidder->tenant_id === $auction->tenant_id) {
                return $reject('REJECTED_OWN_TENANT', 'NOT_ALLOWED_OWN_GALLERY');
            }

            // REQ-7.3: Concurrent duplicate amount rejection
            if ($auction->sequence_no > 0 && $amount === (int) $auction->highest_bid) {
                return $reject('REJECTED_DUPLICATE', 'DUPLICATE');
            }

            // BR-4: Minimum increment check
            $minRequired = $auction->sequence_no === 0
                ? (int) $auction->start_price
                : (int) $auction->highest_bid + (int) $auction->min_increment;

            if ($amount < $minRequired) {
                return $reject('REJECTED_TOO_LOW', 'TOO_LOW (min £'.number_format($minRequired).')');
            }

            // Demote previous highest bid to OUTBID
            Bid::where('auction_id', $auction->id)
                ->where('status', 'ACCEPTED')
                ->update(['status' => 'OUTBID']);

            $nextSeq = (int) $auction->sequence_no + 1;
            $auction->sequence_no = $nextSeq;
            $auction->highest_bid = $amount;
            $auction->highest_bidder_tenant_id = $bidder->tenant_id;
            $auction->highest_bidder_alias = $alias;
            if ($amount >= (int) $auction->reserve_price) {
                $auction->reserve_met = true;
            }

            // REQ-6.4: Anti-sniping (+30 s if bid arrives in final 30 s, max 10)
            $extended = false;
            $remainingSec = $now->diffInSeconds($auction->ends_at, false);
            if ($remainingSec <= 30 && $auction->extensions_count < $auction->max_extensions) {
                $auction->ends_at = $auction->ends_at->copy()->addSeconds(30);
                $auction->extensions_count += 1;
                $auction->status = 'EXTENDED';
                $extended = true;
            }

            $auction->save();

            $procMs = max(0.4, round((hrtime(true) - $startHr) / 1_000_000, 2));
            $bid = Bid::create([
                'id' => "bid-{$nextSeq}-".Str::lower(Str::random(6)),
                'auction_id' => $auction->id,
                'bidder_id' => $bidder->id,
                'bidder_tenant_id' => $bidder->tenant_id,
                'bidder_alias' => $alias,
                'amount' => $amount,
                'sequence_no' => $nextSeq,
                'status' => 'ACCEPTED',
                'client_request_id' => $clientRequestId,
                'processing_ms' => $procMs,
                'server_timestamp' => $serverTs,
            ]);

            return [
                'accepted' => true,
                'statusCode' => 200,
                'bid' => $bid->toApiArray(),
                'extended' => $extended,
                'auction' => $auction,
            ];
        });
    }

    /** UC17 & UC18: Close auction, compare reserve, record Sale + certificate hash */
    public function closeAuction(Auction $auction): string
    {
        return DB::transaction(function () use ($auction) {
            $auction = Auction::where('id', $auction->id)->lockForUpdate()->firstOrFail();
            if (in_array($auction->status, ['SOLD', 'NOT_SOLD'], true)) {
                return $auction->status;
            }

            $met = $auction->sequence_no > 0 && $auction->highest_bid >= $auction->reserve_price;
            $vehicle = Vehicle::find($auction->vehicle_id);

            if ($met) {
                $auction->status = 'SOLD';
                $auction->reserve_met = true;
                $auction->save();

                Sale::updateOrCreate(
                    ['auction_id' => $auction->id],
                    [
                        'id' => 'sale-'.Str::lower(Str::random(8)),
                        'winning_tenant_name' => $auction->highest_bidder_alias ?? 'Verified Dealer',
                        'final_price' => $auction->highest_bid,
                        'sold_at' => Carbon::now(),
                        'certificate_hash' => 'SHA256-DH-'.strtoupper(Str::random(16)),
                    ]
                );

                if ($vehicle) {
                    $vehicle->status = 'SOLD';
                    $vehicle->save();
                }

                return 'SOLD';
            }

            $auction->status = 'NOT_SOLD';
            $auction->save();
            if ($vehicle) {
                $vehicle->status = 'IN_STOCK';
                $vehicle->save();
            }

            return 'NOT_SOLD';
        });
    }
}

