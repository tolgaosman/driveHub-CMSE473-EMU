<?php

namespace Database\Seeders;

use App\Models\Auction;
use App\Models\AuditLog;
use App\Models\Bid;
use App\Models\DamageDetection;
use App\Models\Inspection;
use App\Models\Sale;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Valuation;
use App\Models\Vehicle;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        // 1. KKTC Galleries (Tenants)
        $tenants = [
            ['id' => 'tenant-lefkosa', 'name' => 'Lefkoşa Auto Gallery', 'city' => 'Lefkoşa', 'tax_no' => 'CY-LFK-40821', 'plan' => 'ENTERPRISE', 'is_active' => true, 'verified_dealer' => true],
            ['id' => 'tenant-girne', 'name' => 'Girne Motors', 'city' => 'Girne', 'tax_no' => 'CY-GRN-19204', 'plan' => 'PRO', 'is_active' => true, 'verified_dealer' => true],
            ['id' => 'tenant-magusa', 'name' => 'Mağusa Cars', 'city' => 'Gazimağusa', 'tax_no' => 'CY-MGS-77312', 'plan' => 'PRO', 'is_active' => true, 'verified_dealer' => true],
            ['id' => 'tenant-guzelyurt', 'name' => 'Güzelyurt Auto', 'city' => 'Güzelyurt', 'tax_no' => 'CY-GZY-55190', 'plan' => 'STARTER', 'is_active' => true, 'verified_dealer' => true],
            ['id' => 'tenant-platform', 'name' => 'DriveHub Platform Ops', 'city' => 'Gazimağusa (EMU)', 'tax_no' => 'CY-OPS-00001', 'plan' => 'ENTERPRISE', 'is_active' => true, 'verified_dealer' => false],
        ];
        foreach ($tenants as $t) {
            Tenant::updateOrCreate(['id' => $t['id']], $t);
        }

        // 2. Demo RBAC Users (password: password123)
        $hashed = Hash::make('password123');
        $users = [
            ['id' => 'user-ayse', 'tenant_id' => 'tenant-lefkosa', 'full_name' => 'Ayşe Kaya', 'email' => 'ayse.kaya@gallery-lefkosa.com', 'password' => $hashed, 'role' => 'GALLERY_MANAGER', 'is_active' => true, 'two_factor_enabled' => true, 'avatar_initials' => 'AK'],
            ['id' => 'user-kemal', 'tenant_id' => 'tenant-lefkosa', 'full_name' => 'Kemal Arslan', 'email' => 'inspector@gallery-lefkosa.com', 'password' => $hashed, 'role' => 'INSPECTOR', 'is_active' => true, 'two_factor_enabled' => false, 'avatar_initials' => 'KA'],
            ['id' => 'user-mehmet', 'tenant_id' => 'tenant-girne', 'full_name' => 'Mehmet Demir', 'email' => 'mehmet.d@girnemotors.com', 'password' => $hashed, 'role' => 'DEALER', 'is_active' => true, 'two_factor_enabled' => true, 'avatar_initials' => 'MD'],
            ['id' => 'user-selim', 'tenant_id' => 'tenant-magusa', 'full_name' => 'Selim Öztürk', 'email' => 'selim@magusacars.com', 'password' => $hashed, 'role' => 'DEALER', 'is_active' => true, 'two_factor_enabled' => false, 'avatar_initials' => 'SÖ'],
            ['id' => 'user-guzelyurt', 'tenant_id' => 'tenant-guzelyurt', 'full_name' => 'Hasan Çelik', 'email' => 'hasan@guzelyurtauto.com', 'password' => $hashed, 'role' => 'DEALER', 'is_active' => true, 'two_factor_enabled' => false, 'avatar_initials' => 'HÇ'],
            ['id' => 'user-admin', 'tenant_id' => 'tenant-platform', 'full_name' => 'Tolga O. Falay', 'email' => 'admin@drivehub.com.cy', 'password' => $hashed, 'role' => 'PLATFORM_ADMIN', 'is_active' => true, 'two_factor_enabled' => true, 'avatar_initials' => 'TF'],
        ];
        foreach ($users as $u) {
            User::updateOrCreate(['id' => $u['id']], $u);
        }

        // 3. Vehicles (Exact SRS Fleet + Isolated Girne Stock)
        $vehicles = [
            ['id' => 'veh-bmw-320d', 'tenant_id' => 'tenant-lefkosa', 'vin' => 'WBA8E9C50GK123456', 'make' => 'BMW', 'model' => '320d M-Sport', 'year' => 2016, 'body_type' => 'Saloon', 'engine' => '2.0L TwinPower Diesel', 'fuel' => 'Diesel', 'transmission' => 'Automatic', 'color' => 'Mineral Grey Metallic', 'mileage_km' => 132000, 'status' => 'IN_AUCTION', 'notes' => 'Full Cyprus service booklet. Two minor exterior panel marks verified.', 'image_accent' => '#334155'],
            ['id' => 'veh-qashqai', 'tenant_id' => 'tenant-lefkosa', 'vin' => 'SJNFAAJ10U1234567', 'make' => 'Nissan', 'model' => 'Qashqai Tekna', 'year' => 2017, 'body_type' => 'SUV', 'engine' => '1.5L dCi', 'fuel' => 'Diesel', 'transmission' => 'Automatic', 'color' => 'Pearl White', 'mileage_km' => 71250, 'status' => 'AWAITING_REVIEW', 'notes' => 'Single-owner Girne vehicle. Ready for manager review & auction scheduling.', 'image_accent' => '#475569'],
            ['id' => 'veh-golf', 'tenant_id' => 'tenant-lefkosa', 'vin' => 'WVWZZZ1KZ8W123456', 'make' => 'Volkswagen', 'model' => 'Golf 1.6 TDI', 'year' => 2008, 'body_type' => 'Hatchback', 'engine' => '1.6L TDI', 'fuel' => 'Diesel', 'transmission' => 'Manual', 'color' => 'Reflex Silver', 'mileage_km' => 148300, 'status' => 'IN_STOCK', 'notes' => 'Left rear door repainted previously; runs smoothly.', 'image_accent' => '#64748b'],
            ['id' => 'veh-prius', 'tenant_id' => 'tenant-lefkosa', 'vin' => 'JTDKB20U403012345', 'make' => 'Toyota', 'model' => 'Prius Hybrid', 'year' => 2015, 'body_type' => 'Liftback', 'engine' => '1.8L Hybrid', 'fuel' => 'Hybrid', 'transmission' => 'Automatic', 'color' => 'Glacier Blue', 'mileage_km' => 96400, 'status' => 'IN_AUCTION', 'notes' => 'Hybrid battery health 92%. Zero exterior body flaws detected.', 'image_accent' => '#0f766e'],
            ['id' => 'veh-i20', 'tenant_id' => 'tenant-lefkosa', 'vin' => 'KMHCT41BAEU123456', 'make' => 'Hyundai', 'model' => 'i20 1.4 MPI', 'year' => 2014, 'body_type' => 'Hatchback', 'engine' => '1.4L MPI', 'fuel' => 'Petrol', 'transmission' => 'Automatic', 'color' => 'Sleek Silver', 'mileage_km' => 118900, 'status' => 'ANALYZING', 'notes' => '8/8 photos uploaded from Lefkoşa lot. Queued on GPU node.', 'image_accent' => '#3b82f6'],
            ['id' => 'veh-clio', 'tenant_id' => 'tenant-lefkosa', 'vin' => 'VF1RFB00X56123456', 'make' => 'Renault', 'model' => 'Clio 1.0 TCe', 'year' => 2019, 'body_type' => 'Hatchback', 'engine' => '1.0L TCe', 'fuel' => 'Petrol', 'transmission' => 'Manual', 'color' => 'Flame Red', 'mileage_km' => 44800, 'status' => 'IN_STOCK', 'notes' => 'Low mileage city hatchback. Clean AI inspection.', 'image_accent' => '#991b1b'],
            ['id' => 'veh-cx5', 'tenant_id' => 'tenant-lefkosa', 'vin' => 'JMZKF4W7600123456', 'make' => 'Mazda', 'model' => 'CX-5 Sport Nav', 'year' => 2018, 'body_type' => 'SUV', 'engine' => '2.2L Skyactiv-D', 'fuel' => 'Diesel', 'transmission' => 'Automatic', 'color' => 'Soul Red Crystal', 'mileage_km' => 83100, 'status' => 'SOLD', 'notes' => 'Sold via DriveHub Lightning Auction to Girne Motors.', 'image_accent' => '#7f1d1d'],
            ['id' => 'veh-c200d-girne', 'tenant_id' => 'tenant-girne', 'vin' => 'WDD2050041R456789', 'make' => 'Mercedes-Benz', 'model' => 'C200d AMG Line', 'year' => 2019, 'body_type' => 'Saloon', 'engine' => '1.6L Diesel', 'fuel' => 'Diesel', 'transmission' => 'Automatic', 'color' => 'Obsidian Black', 'mileage_km' => 64200, 'status' => 'IN_STOCK', 'notes' => 'Private Girne Motors stock — strictly isolated (REQ-1.3).', 'image_accent' => '#18181b'],
        ];
        foreach ($vehicles as $v) {
            Vehicle::updateOrCreate(['id' => $v['id']], $v);
        }

        // 4. Inspections, Damages & Valuations
        $inspBmw = Inspection::updateOrCreate(['id' => 'insp-bmw-320d'], [
            'tenant_id' => 'tenant-lefkosa', 'vehicle_id' => 'veh-bmw-320d', 'inspector_id' => 'user-kemal',
            'inspector_name' => 'Kemal Arslan', 'status' => 'FINALIZED', 'model_version' => 'yolov8s-drivehub-v1.4',
            'inference_time_sec' => 2.9, 'plate_blur_enabled' => true,
            'notes' => 'Clean chassis. Right front door dent and rear bumper scratch confirmed.',
            'checklist' => ['tyres' => 'OK', 'lights' => 'OK', 'interior' => 'OK', 'engineBay' => 'OK'],
            'submitted_at' => $now->copy()->subDays(5), 'finalized_at' => $now->copy()->subDays(5),
        ]);
        DamageDetection::updateOrCreate(['id' => 'dmg-bmw-1'], ['tenant_id' => 'tenant-lefkosa', 'inspection_id' => $inspBmw->id, 'angle' => 'right', 'panel' => 'Front door, right side', 'type' => 'DENT', 'confidence' => 0.91, 'bbox' => ['x' => 54, 'y' => 46, 'width' => 18, 'height' => 17], 'source' => 'AI', 'confirmed_by_inspector' => true, 'estimated_deduction_gbp' => 350]);
        DamageDetection::updateOrCreate(['id' => 'dmg-bmw-2'], ['tenant_id' => 'tenant-lefkosa', 'inspection_id' => $inspBmw->id, 'angle' => 'rear', 'panel' => 'Rear bumper', 'type' => 'SCRATCH', 'confidence' => 0.84, 'bbox' => ['x' => 15, 'y' => 52, 'width' => 15, 'height' => 13], 'source' => 'AI', 'confirmed_by_inspector' => true, 'estimated_deduction_gbp' => 200]);
        Valuation::updateOrCreate(['id' => 'val-bmw-320d'], [
            'tenant_id' => 'tenant-lefkosa', 'vehicle_id' => 'veh-bmw-320d', 'inspection_id' => $inspBmw->id,
            'suggested_price' => 12600, 'min_price' => 12100, 'max_price' => 13100, 'model_version' => 'valuation-v1.3',
            'factors' => [
                ['label' => 'KKTC market baseline (BMW 320d 2016)', 'deltaGbp' => 13450, 'category' => 'BASE'],
                ['label' => 'Mileage index (132,000 km)', 'deltaGbp' => -300, 'category' => 'MILEAGE'],
                ['label' => 'Front door, right side dent (91%)', 'deltaGbp' => -350, 'category' => 'DAMAGE'],
                ['label' => 'Rear bumper scratch (84%)', 'deltaGbp' => -200, 'category' => 'DAMAGE'],
            ],
        ]);

        $inspQash = Inspection::updateOrCreate(['id' => 'insp-qashqai'], [
            'tenant_id' => 'tenant-lefkosa', 'vehicle_id' => 'veh-qashqai', 'inspector_id' => 'user-kemal',
            'inspector_name' => 'Kemal Arslan', 'status' => 'FINALIZED', 'model_version' => 'yolov8s-drivehub-v1.4',
            'inference_time_sec' => 2.6, 'plate_blur_enabled' => true,
            'notes' => 'Panoramic roof & 360 camera working. Light rear left scratch.',
            'checklist' => ['tyres' => 'OK', 'lights' => 'OK', 'interior' => 'OK', 'engineBay' => 'OK'],
            'submitted_at' => $now->copy()->subDays(4), 'finalized_at' => $now->copy()->subDays(4),
        ]);
        DamageDetection::updateOrCreate(['id' => 'dmg-qash-1'], ['tenant_id' => 'tenant-lefkosa', 'inspection_id' => $inspQash->id, 'angle' => 'rear-left', 'panel' => 'Rear left quarter panel', 'type' => 'SCRATCH', 'confidence' => 0.87, 'bbox' => ['x' => 22, 'y' => 48, 'width' => 16, 'height' => 12], 'source' => 'AI', 'confirmed_by_inspector' => true, 'estimated_deduction_gbp' => 250]);
        Valuation::updateOrCreate(['id' => 'val-qashqai'], [
            'tenant_id' => 'tenant-lefkosa', 'vehicle_id' => 'veh-qashqai', 'inspection_id' => $inspQash->id,
            'suggested_price' => 11200, 'min_price' => 10700, 'max_price' => 11700, 'model_version' => 'valuation-v1.3',
            'factors' => [
                ['label' => 'KKTC market baseline (Nissan Qashqai 2017)', 'deltaGbp' => 11200, 'category' => 'BASE'],
                ['label' => 'Low mileage bonus (71,250 km)', 'deltaGbp' => 250, 'category' => 'MILEAGE'],
                ['label' => 'Rear left quarter scratch (87%)', 'deltaGbp' => -250, 'category' => 'DAMAGE'],
            ],
        ]);

        $inspGolf = Inspection::updateOrCreate(['id' => 'insp-golf'], [
            'tenant_id' => 'tenant-lefkosa', 'vehicle_id' => 'veh-golf', 'inspector_id' => 'user-kemal',
            'inspector_name' => 'Kemal Arslan', 'status' => 'FINALIZED', 'model_version' => 'yolov8s-drivehub-v1.4',
            'inference_time_sec' => 3.1, 'plate_blur_enabled' => true,
            'notes' => 'Confirmed right door dent and rear bumper scratch.',
            'checklist' => ['tyres' => 'OK', 'lights' => 'OK', 'interior' => 'WARN', 'engineBay' => 'OK'],
            'submitted_at' => $now->copy()->subDays(7), 'finalized_at' => $now->copy()->subDays(7),
        ]);
        DamageDetection::updateOrCreate(['id' => 'dmg-golf-1'], ['tenant_id' => 'tenant-lefkosa', 'inspection_id' => $inspGolf->id, 'angle' => 'right', 'panel' => 'Front door, right side', 'type' => 'DENT', 'confidence' => 0.91, 'bbox' => ['x' => 52, 'y' => 45, 'width' => 17, 'height' => 16], 'source' => 'AI', 'confirmed_by_inspector' => true, 'estimated_deduction_gbp' => 250]);
        DamageDetection::updateOrCreate(['id' => 'dmg-golf-2'], ['tenant_id' => 'tenant-lefkosa', 'inspection_id' => $inspGolf->id, 'angle' => 'rear', 'panel' => 'Rear bumper', 'type' => 'SCRATCH', 'confidence' => 0.84, 'bbox' => ['x' => 16, 'y' => 54, 'width' => 14, 'height' => 12], 'source' => 'AI', 'confirmed_by_inspector' => true, 'estimated_deduction_gbp' => 150]);
        Valuation::updateOrCreate(['id' => 'val-golf'], [
            'tenant_id' => 'tenant-lefkosa', 'vehicle_id' => 'veh-golf', 'inspection_id' => $inspGolf->id,
            'suggested_price' => 4150, 'min_price' => 3900, 'max_price' => 4400, 'model_version' => 'valuation-v1.3',
            'factors' => [
                ['label' => 'KKTC market baseline (VW Golf 2008)', 'deltaGbp' => 4750, 'category' => 'BASE'],
                ['label' => 'Mileage index (148,300 km)', 'deltaGbp' => -200, 'category' => 'MILEAGE'],
                ['label' => 'Front door dent (91%)', 'deltaGbp' => -250, 'category' => 'DAMAGE'],
                ['label' => 'Rear bumper scratch (84%)', 'deltaGbp' => -150, 'category' => 'DAMAGE'],
            ],
        ]);

        foreach ([
            ['id' => 'insp-prius', 'veh' => 'veh-prius', 'valId' => 'val-prius', 'price' => 9800, 'min' => 9400, 'max' => 10200, 'label' => 'Toyota Prius 2015'],
            ['id' => 'insp-clio', 'veh' => 'veh-clio', 'valId' => 'val-clio', 'price' => 8450, 'min' => 8100, 'max' => 8800, 'label' => 'Renault Clio 2019'],
            ['id' => 'insp-cx5', 'veh' => 'veh-cx5', 'valId' => 'val-cx5', 'price' => 14900, 'min' => 14300, 'max' => 15500, 'label' => 'Mazda CX-5 2018'],
        ] as $clean) {
            Inspection::updateOrCreate(['id' => $clean['id']], [
                'tenant_id' => 'tenant-lefkosa', 'vehicle_id' => $clean['veh'], 'inspector_id' => 'user-kemal',
                'inspector_name' => 'Kemal Arslan', 'status' => 'FINALIZED', 'model_version' => 'yolov8s-drivehub-v1.4',
                'inference_time_sec' => 2.5, 'plate_blur_enabled' => true, 'notes' => 'Verified clean inspection.',
                'checklist' => ['tyres' => 'OK', 'lights' => 'OK', 'interior' => 'OK', 'engineBay' => 'OK'],
                'submitted_at' => $now->copy()->subDays(3), 'finalized_at' => $now->copy()->subDays(3),
            ]);
            Valuation::updateOrCreate(['id' => $clean['valId']], [
                'tenant_id' => 'tenant-lefkosa', 'vehicle_id' => $clean['veh'], 'inspection_id' => $clean['id'],
                'suggested_price' => $clean['price'], 'min_price' => $clean['min'], 'max_price' => $clean['max'],
                'model_version' => 'valuation-v1.3',
                'factors' => [['label' => "KKTC market baseline ({$clean['label']})", 'deltaGbp' => $clean['price'], 'category' => 'BASE']],
            ]);
        }

        // 5. Auctions & Bids
        Auction::updateOrCreate(['id' => 'auc-bmw-320d'], [
            'tenant_id' => 'tenant-lefkosa', 'vehicle_id' => 'veh-bmw-320d',
            'start_price' => 11800, 'reserve_price' => 12200, 'reserve_met' => true,
            'min_increment' => 100, 'highest_bid' => 12900,
            'highest_bidder_tenant_id' => 'tenant-girne', 'highest_bidder_alias' => 'Girne Motors',
            'sequence_no' => 18, 'extensions_count' => 0, 'max_extensions' => 10,
            'visibility' => 'ALL_VERIFIED', 'starts_at' => $now->copy()->subMinutes(12),
            'ends_at' => $now->copy()->addMinutes(12), 'status' => 'LIVE', 'connected_bidders' => 14,
        ]);

        foreach ([
            ['id' => 'bid-15', 'bidder_id' => 'user-guzelyurt', 'tenant' => 'tenant-guzelyurt', 'alias' => 'Güzelyurt Auto', 'amt' => 12600, 'seq' => 15, 'status' => 'OUTBID', 'reason' => null, 'req' => 'req-seed-15', 'ms' => 4.5, 'ts' => '14:21:12.870', 'offset' => 40],
            ['id' => 'bid-16', 'bidder_id' => 'user-mehmet', 'tenant' => 'tenant-girne', 'alias' => 'Girne Motors', 'amt' => 12700, 'seq' => 16, 'status' => 'OUTBID', 'reason' => null, 'req' => 'req-seed-16', 'ms' => 3.8, 'ts' => '14:21:30.008', 'offset' => 30],
            ['id' => 'bid-17', 'bidder_id' => 'user-selim', 'tenant' => 'tenant-magusa', 'alias' => 'Mağusa Cars', 'amt' => 12800, 'seq' => 17, 'status' => 'OUTBID', 'reason' => null, 'req' => 'req-seed-17', 'ms' => 4.1, 'ts' => '14:21:39.540', 'offset' => 20],
            ['id' => 'bid-17-dup', 'bidder_id' => 'user-selim', 'tenant' => 'tenant-magusa', 'alias' => 'Mağusa Cars', 'amt' => 12800, 'seq' => null, 'status' => 'REJECTED_DUPLICATE', 'reason' => 'DUPLICATE', 'req' => 'req-seed-17-dup', 'ms' => 1.9, 'ts' => '14:21:39.541', 'offset' => 19],
            ['id' => 'bid-18', 'bidder_id' => 'user-mehmet', 'tenant' => 'tenant-girne', 'alias' => 'Girne Motors', 'amt' => 12900, 'seq' => 18, 'status' => 'ACCEPTED', 'reason' => null, 'req' => 'req-seed-18', 'ms' => 3.4, 'ts' => '14:21:47.112', 'offset' => 10],
        ] as $b) {
            Bid::updateOrCreate(['id' => $b['id']], [
                'auction_id' => 'auc-bmw-320d', 'bidder_id' => $b['bidder_id'],
                'bidder_tenant_id' => $b['tenant'], 'bidder_alias' => $b['alias'],
                'amount' => $b['amt'], 'sequence_no' => $b['seq'], 'status' => $b['status'],
                'rejection_reason' => $b['reason'], 'client_request_id' => $b['req'],
                'processing_ms' => $b['ms'], 'server_timestamp' => $b['ts'],
                'created_at' => $now->copy()->subSeconds($b['offset']),
            ]);
        }

        Auction::updateOrCreate(['id' => 'auc-prius'], [
            'tenant_id' => 'tenant-lefkosa', 'vehicle_id' => 'veh-prius',
            'start_price' => 8900, 'reserve_price' => 9700, 'reserve_met' => false,
            'min_increment' => 100, 'highest_bid' => 9500,
            'highest_bidder_tenant_id' => 'tenant-magusa', 'highest_bidder_alias' => 'Mağusa Cars',
            'sequence_no' => 7, 'extensions_count' => 0, 'max_extensions' => 10,
            'visibility' => 'ALL_VERIFIED', 'starts_at' => $now->copy()->subMinutes(6),
            'ends_at' => $now->copy()->addMinutes(16), 'status' => 'LIVE', 'connected_bidders' => 9,
        ]);
        Bid::updateOrCreate(['id' => 'bid-p7'], [
            'auction_id' => 'auc-prius', 'bidder_id' => 'user-selim',
            'bidder_tenant_id' => 'tenant-magusa', 'bidder_alias' => 'Mağusa Cars',
            'amount' => 9500, 'sequence_no' => 7, 'status' => 'ACCEPTED',
            'client_request_id' => 'req-p7', 'processing_ms' => 2.8, 'server_timestamp' => '14:19:02.411',
        ]);

        Auction::updateOrCreate(['id' => 'auc-cx5-sold'], [
            'tenant_id' => 'tenant-lefkosa', 'vehicle_id' => 'veh-cx5',
            'start_price' => 13800, 'reserve_price' => 14500, 'reserve_met' => true,
            'min_increment' => 100, 'highest_bid' => 15200,
            'highest_bidder_tenant_id' => 'tenant-girne', 'highest_bidder_alias' => 'Girne Motors',
            'sequence_no' => 24, 'extensions_count' => 2, 'max_extensions' => 10,
            'visibility' => 'ALL_VERIFIED', 'starts_at' => $now->copy()->subDays(2),
            'ends_at' => $now->copy()->subDays(2)->addMinutes(21), 'status' => 'SOLD', 'connected_bidders' => 19,
        ]);
        Sale::updateOrCreate(['auction_id' => 'auc-cx5-sold'], [
            'id' => 'sale-cx5-001', 'winning_tenant_name' => 'Girne Motors',
            'final_price' => 15200, 'sold_at' => $now->copy()->subDays(2)->addMinutes(21),
            'certificate_hash' => 'SHA256-DH-9F42C81E7B0A31D6',
        ]);

        // 6. Audit Logs
        foreach ([
            ['id' => 'aud-1', 'tenant_id' => 'tenant-lefkosa', 'actor_name' => 'Ayşe Kaya', 'actor_role' => 'GALLERY_MANAGER', 'action' => 'AUCTION_PUBLISHED', 'resource' => 'auc-bmw-320d', 'severity' => 'INFO', 'details' => 'Published live lightning auction with hidden reserve £12,200 and £100 min increment.'],
            ['id' => 'aud-2', 'tenant_id' => 'tenant-magusa', 'actor_name' => 'Selim Öztürk', 'actor_role' => 'DEALER', 'action' => 'BID_REJECTED_DUPLICATE', 'resource' => 'auc-bmw-320d', 'severity' => 'WARNING', 'details' => 'Atomic sequencer dropped concurrent duplicate £12,800 bid (+1 ms after seq #17).'],
            ['id' => 'aud-3', 'tenant_id' => 'tenant-girne', 'actor_name' => 'Mehmet Demir', 'actor_role' => 'DEALER', 'action' => 'SECURITY_TENANT_GUARD', 'resource' => 'GET /api/vehicles/veh-golf', 'severity' => 'SECURITY', 'details' => 'Cross-tenant private inventory request denied (403 Forbidden) per REQ-1.3.'],
        ] as $a) {
            AuditLog::updateOrCreate(['id' => $a['id']], $a);
        }
    }
}
