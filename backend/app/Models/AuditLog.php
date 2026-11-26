<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'tenant_id', 'actor_name', 'actor_role', 'action', 'resource', 'severity', 'details',
    ];

    public function toApiArray(): array
    {
        return [
            'id' => $this->id,
            'timestamp' => $this->created_at?->toISOString(),
            'tenantId' => $this->tenant_id,
            'actorName' => $this->actor_name,
            'actorRole' => $this->actor_role,
            'action' => $this->action,
            'resource' => $this->resource,
            'severity' => $this->severity,
            'details' => $this->details,
        ];
    }
}

