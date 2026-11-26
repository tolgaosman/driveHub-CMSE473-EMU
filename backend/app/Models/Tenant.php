<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tenant extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'name', 'city', 'tax_no', 'plan', 'is_active', 'verified_dealer',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'verified_dealer' => 'boolean',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function vehicles(): HasMany
    {
        return $this->hasMany(Vehicle::class);
    }

    public function toApiArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'city' => $this->city,
            'taxNo' => $this->tax_no,
            'plan' => $this->plan,
            'isActive' => (bool) $this->is_active,
            'verifiedDealer' => (bool) $this->verified_dealer,
            'createdAt' => $this->created_at?->toISOString(),
        ];
    }
}

