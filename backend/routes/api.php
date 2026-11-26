<?php

use App\Http\Controllers\Api\AuctionController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PlatformController;
use App\Http\Controllers\Api\VehicleController;
use Illuminate\Support\Facades\Route;

// Public health, OpenAPI & Auth routes
Route::get('/health', [PlatformController::class, 'health']);
Route::get('/openapi.json', [PlatformController::class, 'openApi']);
Route::get('/demo/accounts', [AuthController::class, 'demoAccounts']);
Route::post('/demo/reset', [PlatformController::class, 'demoReset']);

Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/demo-switch', [AuthController::class, 'demoSwitch']);

// Protected JWT Multi-Tenant Routes
Route::middleware(['jwt'])->group(function () {
    Route::get('/vin/{vin}', [VehicleController::class, 'decodeVin']);

    Route::get('/vehicles', [VehicleController::class, 'index']);
    Route::get('/vehicles/{id}', [VehicleController::class, 'show']);

    Route::post('/vehicles', [VehicleController::class, 'store'])
        ->middleware('role:INSPECTOR,GALLERY_MANAGER,PLATFORM_ADMIN');

    Route::post('/inspections/complete', [VehicleController::class, 'completeInspection'])
        ->middleware('role:INSPECTOR,GALLERY_MANAGER,PLATFORM_ADMIN');

    Route::put('/vehicles/{id}/price-override', [VehicleController::class, 'overridePrice'])
        ->middleware('role:GALLERY_MANAGER,PLATFORM_ADMIN');

    Route::get('/auctions', [AuctionController::class, 'index']);
    Route::get('/auctions/{id}', [AuctionController::class, 'show']);
    Route::post('/auctions', [AuctionController::class, 'store'])
        ->middleware('role:GALLERY_MANAGER,PLATFORM_ADMIN');
    Route::post('/auctions/{id}/bids', [AuctionController::class, 'placeBid']);

    Route::get('/reports/summary', [PlatformController::class, 'reportsSummary']);
    Route::get('/admin/overview', [PlatformController::class, 'adminOverview']);
    Route::patch('/admin/tenants/{id}/toggle', [PlatformController::class, 'toggleTenant'])
        ->middleware('role:PLATFORM_ADMIN');

    // Demo Director live controls
    Route::post('/demo/rival-bid', [PlatformController::class, 'demoRivalBid']);
    Route::post('/demo/race-condition', [PlatformController::class, 'demoRaceCondition']);
    Route::post('/demo/fast-forward', [PlatformController::class, 'demoFastForward']);
    Route::post('/demo/close-now', [PlatformController::class, 'demoCloseNow']);
});

