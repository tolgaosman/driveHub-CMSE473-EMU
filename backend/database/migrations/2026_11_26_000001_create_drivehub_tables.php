<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicles', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('tenant_id', 64)->index();
            $table->string('vin', 17);
            $table->string('make', 64);
            $table->string('model', 100);
            $table->unsignedSmallInteger('year');
            $table->string('body_type', 48)->default('Saloon');
            $table->string('engine', 64)->default('1.6L');
            $table->string('fuel', 24)->default('Petrol');
            $table->string('transmission', 24)->default('Automatic');
            $table->string('color', 64)->default('Metallic Grey');
            $table->unsignedInteger('mileage_km');
            $table->string('status', 32)->default('REGISTERED')->index();
            $table->text('notes')->nullable();
            $table->string('image_accent', 24)->default('#334155');
            $table->timestamps();

            $table->unique(['tenant_id', 'vin']); // REQ-2.4
            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
        });

        Schema::create('inspections', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('tenant_id', 64)->index();
            $table->string('vehicle_id', 64)->index();
            $table->string('inspector_id', 64)->nullable();
            $table->string('inspector_name', 100);
            $table->string('status', 32)->default('FINALIZED');
            $table->string('model_version', 64)->default('yolov8s-drivehub-v1.4');
            $table->decimal('inference_time_sec', 5, 2)->default(2.8);
            $table->boolean('plate_blur_enabled')->default(true);
            $table->text('notes')->nullable();
            $table->json('checklist');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('finalized_at')->nullable();
            $table->timestamps();

            $table->foreign('vehicle_id')->references('id')->on('vehicles')->cascadeOnDelete();
        });

        Schema::create('damage_detections', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('tenant_id', 64)->index();
            $table->string('inspection_id', 64)->index();
            $table->string('angle', 24);
            $table->string('panel', 100);
            $table->string('type', 32);
            $table->decimal('confidence', 4, 2);
            $table->json('bbox');
            $table->string('source', 16)->default('AI');
            $table->boolean('confirmed_by_inspector')->nullable();
            $table->unsignedInteger('estimated_deduction_gbp')->default(200);
            $table->timestamps();

            $table->foreign('inspection_id')->references('id')->on('inspections')->cascadeOnDelete();
        });

        Schema::create('valuations', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('tenant_id', 64)->index();
            $table->string('vehicle_id', 64)->index();
            $table->string('inspection_id', 64)->nullable();
            $table->unsignedInteger('suggested_price');
            $table->unsignedInteger('min_price');
            $table->unsignedInteger('max_price');
            $table->unsignedInteger('overridden_price')->nullable();
            $table->text('override_reason')->nullable();
            $table->string('overridden_by', 100)->nullable();
            $table->timestamp('overridden_at')->nullable();
            $table->string('model_version', 48)->default('valuation-v1.3');
            $table->json('factors');
            $table->timestamps();

            $table->foreign('vehicle_id')->references('id')->on('vehicles')->cascadeOnDelete();
        });

        Schema::create('auctions', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('tenant_id', 64)->index();
            $table->string('vehicle_id', 64)->index();
            $table->unsignedInteger('start_price');
            $table->unsignedInteger('reserve_price');
            $table->boolean('reserve_met')->default(false);
            $table->unsignedInteger('min_increment')->default(100);
            $table->unsignedInteger('highest_bid');
            $table->string('highest_bidder_tenant_id', 64)->nullable();
            $table->string('highest_bidder_alias', 120)->nullable();
            $table->unsignedInteger('sequence_no')->default(0);
            $table->unsignedTinyInteger('extensions_count')->default(0);
            $table->unsignedTinyInteger('max_extensions')->default(10);
            $table->string('visibility', 32)->default('ALL_VERIFIED');
            $table->timestamp('starts_at');
            $table->timestamp('ends_at');
            $table->string('status', 32)->default('LIVE')->index();
            $table->unsignedInteger('connected_bidders')->default(12);
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->foreign('vehicle_id')->references('id')->on('vehicles')->cascadeOnDelete();
        });

        Schema::create('bids', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('auction_id', 64)->index();
            $table->string('bidder_id', 64);
            $table->string('bidder_tenant_id', 64);
            $table->string('bidder_alias', 120);
            $table->unsignedInteger('amount');
            $table->unsignedInteger('sequence_no')->nullable();
            $table->string('status', 32);
            $table->string('rejection_reason', 120)->nullable();
            $table->string('client_request_id', 100);
            $table->decimal('processing_ms', 6, 2)->default(1.2);
            $table->string('server_timestamp', 24);
            $table->timestamps();

            $table->unique(['auction_id', 'client_request_id']); // REQ-7.5 idempotency
            $table->foreign('auction_id')->references('id')->on('auctions')->cascadeOnDelete();
        });

        Schema::create('sales', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('auction_id', 64)->unique();
            $table->string('winning_tenant_name', 120);
            $table->unsignedInteger('final_price');
            $table->timestamp('sold_at');
            $table->string('certificate_hash', 100);
            $table->timestamps();

            $table->foreign('auction_id')->references('id')->on('auctions')->cascadeOnDelete();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('tenant_id', 64)->index();
            $table->string('actor_name', 120);
            $table->string('actor_role', 32);
            $table->string('action', 64)->index();
            $table->string('resource', 160);
            $table->string('severity', 16)->default('INFO');
            $table->text('details');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('sales');
        Schema::dropIfExists('bids');
        Schema::dropIfExists('auctions');
        Schema::dropIfExists('valuations');
        Schema::dropIfExists('damage_detections');
        Schema::dropIfExists('inspections');
        Schema::dropIfExists('vehicles');
    }
};

