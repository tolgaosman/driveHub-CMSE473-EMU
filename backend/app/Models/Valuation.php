<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Valuation extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'tenant_id', 'vehicle_id', 'inspection_id', 'suggested_price',
        'min_price', 'max_price', 'overridden_price', 'override_reason',
        'overridden_by', 'overridden_at', 'model_version', 'factors',
    ];

    protected $casts = [
        'factors' => 'array',
        'overridden_at' => 'datetime',
    ];

    public function toApiArray(): array
    {
        return [
            'id' => $this->id,
            'suggestedPrice' => (int) $this->suggested_price,
            'minPrice' => (int) $this->min_price,
            'maxPrice' => (int) $this->max_price,
            'overriddenPrice' => $this->overridden_price !== null ? (int) $this->overridden_price : null,
            'overrideReason' => $this->override_reason,
            'overriddenBy' => $this->overridden_by,
            'overriddenAt' => $this->overridden_at?->toISOString(),
            'modelVersion' => $this->model_version,
            'factors' => $this->factors ?? [],
            'createdAt' => $this->created_at?->toISOString(),
        ];
    }
}

