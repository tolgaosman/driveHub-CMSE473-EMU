<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'tenant_id', 'full_name', 'email', 'password', 'role',
        'is_active', 'two_factor_enabled', 'avatar_initials',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'is_active' => 'boolean',
        'two_factor_enabled' => 'boolean',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function toApiArray(): array
    {
        return [
            'id' => $this->id,
            'tenantId' => $this->tenant_id,
            'tenantName' => $this->tenant?->name ?? 'DriveHub',
            'email' => $this->email,
            'fullName' => $this->full_name,
            'role' => $this->role,
            'isActive' => (bool) $this->is_active,
            'twoFactorEnabled' => (bool) $this->two_factor_enabled,
            'avatarInitials' => $this->avatar_initials,
        ];
    }
}
