<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Inspection extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'tenant_id', 'vehicle_id', 'inspector_id', 'inspector_name',
        'status', 'model_version', 'inference_time_sec', 'plate_blur_enabled',
        'notes', 'checklist', 'submitted_at', 'finalized_at',
    ];

    protected $casts = [
        'plate_blur_enabled' => 'boolean',
        'checklist' => 'array',
        'submitted_at' => 'datetime',
        'finalized_at' => 'datetime',
    ];

    public function damages(): HasMany
    {
        return $this->hasMany(DamageDetection::class);
    }

    public function toApiArray(): array
    {
        $this->loadMissing('damages');

        return [
            'id' => $this->id,
            'vehicleId' => $this->vehicle_id,
            'inspectorId' => $this->inspector_id,
            'inspectorName' => $this->inspector_name,
            'status' => $this->status,
            'modelVersion' => $this->model_version,
            'inferenceTimeSec' => (float) $this->inference_time_sec,
            'plateBlurEnabled' => (bool) $this->plate_blur_enabled,
            'notes' => $this->notes ?? '',
            'checklist' => $this->checklist ?? ['tyres' => 'OK', 'lights' => 'OK', 'interior' => 'OK', 'engineBay' => 'OK'],
            'damages' => $this->damages->map(fn (DamageDetection $d) => $d->toApiArray())->values()->all(),
            'submittedAt' => $this->submitted_at?->toISOString(),
            'finalizedAt' => $this->finalized_at?->toISOString(),
        ];
    }
}

