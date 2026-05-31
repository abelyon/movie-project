<?php

namespace Tests\Feature;

use App\Models\Media;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SavedMediaPerformanceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.tmdb.url' => 'https://api.themoviedb.org/3']);
        config(['services.tmdb.api_key' => 'test-key']);
    }

    public function test_saved_returns_all_titles_and_dedupes_tmdb_requests(): void
    {
        Http::fake([
            'https://api.themoviedb.org/3/movie/*' => Http::response(['title' => 'A Movie'], 200),
            'https://api.themoviedb.org/3/tv/*' => Http::response(['name' => 'A Show'], 200),
        ]);

        $user = User::factory()->create();
        foreach ([101, 102, 103] as $id) {
            Media::create([
                'user_id' => $user->id,
                'tmdb_id' => $id,
                'type' => 'movie',
                'is_saved' => true,
            ]);
        }
        Media::create([
            'user_id' => $user->id,
            'tmdb_id' => 201,
            'type' => 'tv',
            'is_saved' => true,
        ]);

        $this->actingAs($user, 'sanctum');

        $response = $this->getJson('/api/user/media/saved');

        $response->assertOk();
        $this->assertCount(4, $response->json('results'));

        // One request per unique saved title.
        Http::assertSentCount(4);
    }

    public function test_saved_caches_tmdb_details_across_requests(): void
    {
        Http::fake([
            'https://api.themoviedb.org/3/movie/*' => Http::response(['title' => 'Cached Movie'], 200),
        ]);

        $user = User::factory()->create();
        Media::create([
            'user_id' => $user->id,
            'tmdb_id' => 555,
            'type' => 'movie',
            'is_saved' => true,
        ]);

        $this->actingAs($user, 'sanctum');

        $this->getJson('/api/user/media/saved')->assertOk();
        $this->getJson('/api/user/media/saved')->assertOk();

        // Second load must be served from cache: only one external call total.
        Http::assertSentCount(1);
    }
}
