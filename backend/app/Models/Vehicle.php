<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Vehicle extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'tenant_id', 'vin', 'make', 'model', 'year', 'body_type',
        'engine', 'fuel', 'transmission', 'color', 'mileage_km',
        'status', 'notes', 'image_accent',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function inspection(): HasOne
    {
        return $this->hasOne(Inspection::class)->latestOfMany();
    }

    public function valuation(): HasOne
    {
        return $this->hasOne(Valuation::class)->latestOfMany();
    }

    public function toApiArray(): array
    {
        $this->loadMissing(['tenant', 'inspection.damages', 'valuation']);

        return [
            'id' => $this->id,
            'tenantId' => $this->tenant_id,
            'tenantName' => $this->tenant?->name ?? '',
            'vin' => $this->vin,
            'make' => $this->make,
            'model' => $this->model,
            'year' => (int) $this->year,
            'bodyType' => $this->body_type,
            'engine' => $this->engine,
            'fuel' => $this->fuel,
            'transmission' => $this->transmission,
            'color' => $this->color,
            'mileageKm' => (int) $this->mileage_km,
            'status' => $this->status,
            'notes' => $this->notes ?? '',
            'imageAccent' => $this->image_accent,
            'inspection' => $this->inspection?->toApiArray(),
            'valuation' => $this->valuation?->toApiArray(),
            'createdAt' => $this->created_at?->toISOString(),
        ];
    }
}

