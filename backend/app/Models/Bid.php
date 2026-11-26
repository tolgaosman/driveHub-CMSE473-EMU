<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Bid extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'auction_id', 'bidder_id', 'bidder_tenant_id', 'bidder_alias',
        'amount', 'sequence_no', 'status', 'rejection_reason',
        'client_request_id', 'processing_ms', 'server_timestamp',
    ];

    public function toApiArray(): array
    {
        return [
            'id' => $this->id,
            'auctionId' => $this->auction_id,
            'bidderId' => $this->bidder_id,
            'bidderTenantId' => $this->bidder_tenant_id,
            'bidderAlias' => $this->bidder_alias,
            'amount' => (int) $this->amount,
            'sequenceNo' => $this->sequence_no !== null ? (int) $this->sequence_no : null,
            'status' => $this->status,
            'rejectionReason' => $this->rejection_reason,
            'clientRequestId' => $this->client_request_id,
            'processingMs' => (float) $this->processing_ms,
            'serverTimestamp' => $this->server_timestamp,
        ];
    }
}

