<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Auction extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'tenant_id', 'vehicle_id', 'start_price', 'reserve_price',
        'reserve_met', 'min_increment', 'highest_bid', 'highest_bidder_tenant_id',
        'highest_bidder_alias', 'sequence_no', 'extensions_count', 'max_extensions',
        'visibility', 'starts_at', 'ends_at', 'status', 'connected_bidders',
    ];

    protected $casts = [
        'reserve_met' => 'boolean',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function bids(): HasMany
    {
        return $this->hasMany(Bid::class)->orderByDesc('created_at')->orderByDesc('sequence_no');
    }

    public function sale(): HasOne
    {
        return $this->hasOne(Sale::class);
    }

    /** BR-5: Strip reservePrice for DEALER role */
    public function toApiArrayFor(string $role, string $viewerTenantId): array
    {
        $this->loadMissing(['tenant', 'bids', 'sale']);

        $canSeeReserve = $role === 'PLATFORM_ADMIN'
            || ($role === 'GALLERY_MANAGER' && $this->tenant_id === $viewerTenantId);

        $data = [
            'id' => $this->id,
            'tenantId' => $this->tenant_id,
            'tenantName' => $this->tenant?->name ?? '',
            'vehicleId' => $this->vehicle_id,
            'startPrice' => (int) $this->start_price,
            'reserveMet' => (bool) $this->reserve_met,
            'minIncrement' => (int) $this->min_increment,
            'highestBid' => (int) $this->highest_bid,
            'highestBidderTenantId' => $this->highest_bidder_tenant_id,
            'highestBidderAlias' => $this->highest_bidder_alias,
            'sequenceNo' => (int) $this->sequence_no,
            'extensionsCount' => (int) $this->extensions_count,
            'maxExtensions' => (int) $this->max_extensions,
            'visibility' => $this->visibility,
            'startsAt' => $this->starts_at?->toISOString(),
            'endsAt' => $this->ends_at?->toISOString(),
            'status' => $this->status,
            'connectedBidders' => (int) $this->connected_bidders,
            'bids' => $this->bids->map(fn (Bid $b) => $b->toApiArray())->values()->all(),
            'sale' => $this->sale?->toApiArray(),
        ];

        if ($canSeeReserve) {
            $data['reservePrice'] = (int) $this->reserve_price;
        }

        return $data;
    }
}

