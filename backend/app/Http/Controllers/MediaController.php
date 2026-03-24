<?php

namespace App\Http\Controllers;

use App\Models\Media;
use App\Http\Requests\MediaIdRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class MediaController extends Controller
{
    private function getTmdbUrl(): string
    {
        return config('services.tmdb.url');
    }

    private function getTmdbKey(): string
    {
        return config('services.tmdb.api_key');
    }

    private function fetchFromTmdb(string $type, int $tmdbId): ?array
    {
        $url = $this->getTmdbUrl();
        $key = $this->getTmdbKey();
        $response = Http::get("{$url}/{$type}/{$tmdbId}", ['api_key' => $key]);
        if ($response->failed()) {
            return null;
        }
        $data = $response->json();
        $data['media_type'] = $type === 'movie' ? 'movie' : 'tv';
        $data['id'] = $tmdbId;
        if ($type === 'movie') {
            $data['title'] = $data['title'] ?? null;
        } else {
            $data['name'] = $data['name'] ?? null;
        }
        return $data;
    }

    private function updateOrCreate(Request $request, array $attributes): Media
    {
        $user = $request->user();
        $tmdbId = (int) $request->input('tmdb_id');
        $mediaType = $request->input('media_type');
        if (!in_array($mediaType, ['movie', 'tv'], true)) {
            abort(400, 'Invalid media_type');
        }
        return Media::updateOrCreate(
            [
                'user_id' => $user->id,
                'tmdb_id' => $tmdbId,
                'type' => $mediaType,
            ],
            $attributes
        );
    }

    public function index(Request $request): JsonResponse
    {
        $query = $request->user()->media();

        if ($request->boolean('saved')) {
            $query->where('is_saved', true);
        }
        if ($request->boolean('liked')) {
            $query->where('is_liked', true);
        }
        if ($request->boolean('disliked')) {
            $query->where('is_disliked', true);
        }

        return response()->json($query->get());
    }

    public function state(Request $request): JsonResponse
    {
        $user = $request->user();
        $ids = $request->query('ids', []);
        $types = $request->query('types', []);

        if (!is_array($ids)) {
            $ids = $ids ? explode(',', $ids) : [];
        }
        if (!is_array($types)) {
            $types = $types ? explode(',', $types) : [];
        }

        $out = [];
        if (count($ids) !== count($types) || empty($ids)) {
            return response()->json($out);
        }

        $rows = Media::where('user_id', $user->id)
            ->whereIn('tmdb_id', array_map('intval', $ids))
            ->get()
            ->keyBy(fn (Media $r) => "{$r->type}-{$r->tmdb_id}");

        for ($i = 0; $i < count($ids); $i++) {
            $key = $types[$i] . '-' . $ids[$i];
            $row = $rows->get($key);
            $out[$key] = [
                'is_saved' => $row ? $row->is_saved : false,
                'is_liked' => $row ? $row->is_liked : false,
                'is_disliked' => $row ? $row->is_disliked : false,
                'watched_at' => $row && $row->watched_at ? $row->watched_at->toIso8601String() : null,
            ];
        }

        return response()->json($out);
    }

    public function saved(Request $request): JsonResponse
    {
        $user = $request->user();
        $rows = Media::where('user_id', $user->id)->where('is_saved', true)->get();
        $results = [];
        foreach ($rows as $row) {
            $type = $row->type === 'movie' ? 'movie' : 'tv';
            $item = $this->fetchFromTmdb($type, (int) $row->tmdb_id);
            if ($item) {
                $results[] = $item;
            }
        }
        return response()->json(['results' => $results]);
    }

    public function liked(Request $request): JsonResponse
    {
        $user = $request->user();
        $rows = Media::where('user_id', $user->id)->where('is_liked', true)->get();
        $results = [];
        foreach ($rows as $row) {
            $type = $row->type === 'movie' ? 'movie' : 'tv';
            $item = $this->fetchFromTmdb($type, (int) $row->tmdb_id);
            if ($item) {
                $results[] = $item;
            }
        }
        return response()->json(['results' => $results]);
    }

    public function save(MediaIdRequest $request): JsonResponse
    {
        $row = $this->updateOrCreate($request, ['is_saved' => true]);
        return response()->json([
            'tmdb_id' => $row->tmdb_id,
            'media_type' => $row->type,
            'is_saved' => true,
        ]);
    }

    public function unsave(MediaIdRequest $request): JsonResponse
    {
        $row = $this->updateOrCreate($request, ['is_saved' => false]);
        return response()->json([
            'tmdb_id' => $row->tmdb_id,
            'media_type' => $row->type,
            'is_saved' => false,
        ]);
    }

    public function like(MediaIdRequest $request): JsonResponse
    {
        $row = $this->updateOrCreate($request, [
            'is_saved' => true,
            'is_liked' => true,
            'is_disliked' => false,
            'watched_at' => now(),
        ]);
        return response()->json([
            'tmdb_id' => $row->tmdb_id,
            'media_type' => $row->type,
            'is_liked' => true,
            'is_disliked' => false,
        ]);
    }

    public function unlike(MediaIdRequest $request): JsonResponse
    {
        $row = $this->updateOrCreate($request, ['is_liked' => false]);
        return response()->json([
            'tmdb_id' => $row->tmdb_id,
            'media_type' => $row->type,
            'is_liked' => false,
        ]);
    }

    public function dislike(MediaIdRequest $request): JsonResponse
    {
        $row = $this->updateOrCreate($request, [
            'is_saved' => true,
            'is_disliked' => true,
            'is_liked' => false,
            'watched_at' => now(),
        ]);
        return response()->json([
            'tmdb_id' => $row->tmdb_id,
            'media_type' => $row->type,
            'is_disliked' => true,
            'is_liked' => false,
        ]);
    }

    public function undislike(MediaIdRequest $request): JsonResponse
    {
        $row = $this->updateOrCreate($request, ['is_disliked' => false]);
        return response()->json([
            'tmdb_id' => $row->tmdb_id,
            'media_type' => $row->type,
            'is_disliked' => false,
        ]);
    }

    public function watched(MediaIdRequest $request): JsonResponse
    {
        $row = $this->updateOrCreate($request, ['watched_at' => now()]);
        return response()->json([
            'tmdb_id' => $row->tmdb_id,
            'media_type' => $row->type,
            'watched_at' => $row->watched_at?->toIso8601String(),
        ]);
    }
}
