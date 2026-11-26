<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DamageDetection extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'tenant_id', 'inspection_id', 'angle', 'panel', 'type',
        'confidence', 'bbox', 'source', 'confirmed_by_inspector', 'estimated_deduction_gbp',
    ];

    protected $casts = [
        'bbox' => 'array',
        'confirmed_by_inspector' => 'boolean',
    ];

    public function toApiArray(): array
    {
        return [
            'id' => $this->id,
            'angle' => $this->angle,
            'panel' => $this->panel,
            'type' => $this->type,
            'confidence' => (float) $this->confidence,
            'bbox' => $this->bbox,
            'source' => $this->source,
            'confirmedByInspector' => $this->confirmed_by_inspector,
            'estimatedDeductionGbp' => (int) $this->estimated_deduction_gbp,
        ];
    }
}

