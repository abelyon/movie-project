<?php

namespace App\Http\Controllers;

use App\Models\FriendRequest;
use App\Models\Media;
use App\Http\Requests\MediaIdRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class MediaController extends Controller
{
    private function applyNeutralSavedFilter($query)
    {
        return $query
            ->where('is_saved', true)
            ->where(function ($q): void {
                $q->where('is_liked', false)->orWhereNull('is_liked');
            })
            ->where(function ($q): void {
                $q->where('is_disliked', false)->orWhereNull('is_disliked');
            });
    }

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
                'is_favorited' => $row ? $row->is_favorited : false,
                'watched_at' => $row && $row->watched_at ? $row->watched_at->toIso8601String() : null,
            ];
        }

        return response()->json($out);
    }

    public function saved(Request $request): JsonResponse
    {
        $user = $request->user();
        $rows = $this->applyNeutralSavedFilter(
            Media::query()->where('user_id', $user->id)
        )->get();

        if ($request->boolean('with_friends_saved')) {
            $requestedFriendIds = $request->query('friend_ids', []);
            if (!is_array($requestedFriendIds)) {
                $requestedFriendIds = $requestedFriendIds !== ''
                    ? explode(',', (string) $requestedFriendIds)
                    : [];
            }
            $requestedFriendIds = array_values(array_unique(array_map('intval', $requestedFriendIds)));

            $friendIds = FriendRequest::query()
                ->where('status', 'accepted')
                ->where(function ($q) use ($user): void {
                    $q->where('requester_id', $user->id)
                        ->orWhere('recipient_id', $user->id);
                })
                ->get()
                ->map(function (FriendRequest $fr) use ($user) {
                    return $fr->requester_id === $user->id ? $fr->recipient_id : $fr->requester_id;
                })
                ->unique()
                ->values();

            if (!empty($requestedFriendIds)) {
                $friendIds = $friendIds
                    ->filter(fn (int $id): bool => in_array($id, $requestedFriendIds, true))
                    ->values();
            }

            if ($friendIds->isEmpty()) {
                $rows = collect();
            } else {
                $userSavedKeys = $rows
                    ->map(fn (Media $item) => "{$item->type}-{$item->tmdb_id}")
                    ->unique()
                    ->values();

                if ($userSavedKeys->isEmpty()) {
                    $rows = collect();
                } else {
                    $friendSharedKeys = $this->applyNeutralSavedFilter(
                        Media::query()->whereIn('user_id', $friendIds->all())
                    )->get()
                        ->map(fn (Media $item) => "{$item->type}-{$item->tmdb_id}")
                        ->intersect($userSavedKeys)
                        ->values();

                    $rows = $rows
                        ->filter(fn (Media $item) => $friendSharedKeys->contains("{$item->type}-{$item->tmdb_id}"))
                        ->values();
                }
            }
        }

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

    public function favorite(MediaIdRequest $request): JsonResponse
    {
        $row = $this->updateOrCreate($request, [
            'is_saved' => true,
            'is_favorited' => true,
        ]);
        return response()->json([
            'tmdb_id' => $row->tmdb_id,
            'media_type' => $row->type,
            'is_favorited' => true,
            'is_saved' => true,
        ]);
    }

    public function unfavorite(MediaIdRequest $request): JsonResponse
    {
        $row = $this->updateOrCreate($request, ['is_favorited' => false]);
        return response()->json([
            'tmdb_id' => $row->tmdb_id,
            'media_type' => $row->type,
            'is_favorited' => false,
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
