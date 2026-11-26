<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'auction_id', 'winning_tenant_name', 'final_price', 'sold_at', 'certificate_hash',
    ];

    protected $casts = [
        'sold_at' => 'datetime',
    ];

    public function toApiArray(): array
    {
        return [
            'id' => $this->id,
            'winningTenantName' => $this->winning_tenant_name,
            'finalPrice' => (int) $this->final_price,
            'soldAt' => $this->sold_at?->toISOString(),
            'certificateHash' => $this->certificate_hash,
        ];
    }
}

