<?php

namespace Tests\Feature;

use App\Models\Auction;
use App\Models\User;
use App\Services\AtomicAuctionService;
use App\Services\JwtService;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class DriveHubSrsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    private function tokenFor(string $userId): string
    {
        $user = User::with('tenant')->findOrFail($userId);

        return app(JwtService::class)->sign($user);
    }

    public function test_iso3779_vin_validation_and_decoding(): void
    {
        $token = $this->tokenFor('user-kemal');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/vin/WBA8E9C50GK123456')
            ->assertOk()
            ->assertJsonPath('decoded.make', 'BMW');

        // Letter O forbidden by ISO 3779 (REQ-2.1)
        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/vin/WBA8E9C5OGK123456')
            ->assertStatus(400);
    }

    public function test_cross_tenant_isolation_blocks_private_stock_access(): void
    {
        // Mehmet (Girne Motors) trying to read Lefkosa Auto Gallery private vehicle (REQ-1.3)
        $token = $this->tokenFor('user-mehmet');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/vehicles/veh-golf')
            ->assertStatus(403);
    }

    public function test_hidden_reserve_is_stripped_for_dealers_and_visible_to_seller_manager(): void
    {
        $dealerToken = $this->tokenFor('user-mehmet');
        $managerToken = $this->tokenFor('user-ayse');

        $dealerResp = $this->withHeader('Authorization', "Bearer {$dealerToken}")
            ->getJson('/api/auctions/auc-bmw-320d')
            ->assertOk();
        $this->assertArrayNotHasKey('reservePrice', $dealerResp->json('auction'));
        $this->assertTrue($dealerResp->json('auction.reserveMet'));

        $managerResp = $this->withHeader('Authorization', "Bearer {$managerToken}")
            ->getJson('/api/auctions/auc-bmw-320d')
            ->assertOk();
        $this->assertSame(12200, $managerResp->json('auction.reservePrice'));
    }

    public function test_seller_own_gallery_cannot_bid_on_own_vehicle(): void
    {
        // Ayse (Lefkosa Auto Gallery) bidding on Lefkosa's own BMW auction (BR-3)
        $managerToken = $this->tokenFor('user-ayse');

        $this->withHeader('Authorization', "Bearer {$managerToken}")
            ->postJson('/api/auctions/auc-bmw-320d/bids', [
                'amount' => 13500,
                'clientRequestId' => 'self-bid-test',
            ])
            ->assertStatus(409)
            ->assertJsonPath('reason', 'NOT_ALLOWED_OWN_GALLERY');
    }

    public function test_atomic_race_condition_accepts_only_one_of_multiple_simultaneous_bids(): void
    {
        $dealerToken = $this->tokenFor('user-mehmet');

        $this->withHeader('Authorization', "Bearer {$dealerToken}")
            ->postJson('/api/demo/race-condition', ['auctionId' => 'auc-bmw-320d'])
            ->assertOk()
            ->assertJsonPath('acceptedCount', 1)
            ->assertJsonPath('rejectedCount', 2);
    }

    public function test_anti_sniping_extends_auction_by_30_seconds_in_final_window(): void
    {
        $auction = Auction::findOrFail('auc-bmw-320d');
        $now = Carbon::now();
        $auction->ends_at = $now->copy()->addSeconds(15);
        $auction->save();

        $prevEnd = $auction->ends_at->timestamp;
        $bidder = User::with('tenant')->findOrFail('user-selim');

        $outcome = app(AtomicAuctionService::class)->placeBid(
            'auc-bmw-320d',
            $bidder,
            13000,
            'snipe-ext-1',
            $now
        );

        $this->assertTrue($outcome['accepted']);
        $this->assertTrue($outcome['extended']);
        $auction->refresh();
        $this->assertSame('EXTENDED', $auction->status);
        $this->assertSame($prevEnd + 30, $auction->ends_at->timestamp);
    }
}

