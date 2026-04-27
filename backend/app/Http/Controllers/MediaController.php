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

    private function applyFriendSelectedSavedFilter($query)
    {
        return $query
            ->where('is_saved', true)
            ->where(function ($q): void {
                $q->where('is_favorited', true)
                    ->orWhere(function ($nested): void {
                        $nested
                            ->where(function ($liked): void {
                                $liked->where('is_liked', false)->orWhereNull('is_liked');
                            })
                            ->where(function ($disliked): void {
                                $disliked->where('is_disliked', false)->orWhereNull('is_disliked');
                            });
                    });
            });
    }

    private function applySocialLibraryFilter($query)
    {
        return $query
            ->where(function ($q): void {
                $q->where('is_saved', true)
                    ->orWhere('is_liked', true)
                    ->orWhere('is_disliked', true)
                    ->orWhere('is_favorited', true)
                    ->orWhereNotNull('watched_at');
            });
    }

    private function scoreUserRow(Media $row): float
    {
        $score = 0;
        if ($row->is_saved) {
            $score += 3;
        }
        if ($row->is_liked) {
            // Treat liked+watched as lower priority than unseen picks.
            $score += $row->watched_at !== null ? 1.0 : 3.0;
        }
        if ($row->watched_at !== null) {
            // Keep watched as a weaker interest signal than saved.
            $score += 0.5;
        }
        if ($row->is_disliked) {
            $score -= 10;
        }
        return $score;
    }

    private function discoverByGenre(string $type, int $genreId, int $page = 1): array
    {
        $response = Http::get("{$this->getTmdbUrl()}/discover/{$type}", [
            'api_key' => $this->getTmdbKey(),
            'include_genres' => $genreId,
            'sort_by' => 'vote_average.desc',
            'vote_count.gte' => 200,
            'page' => $page,
        ]);

        if ($response->failed()) {
            return [];
        }

        return $response->json('results') ?? [];
    }

    private function trendingFallback(): array
    {
        $response = Http::get("{$this->getTmdbUrl()}/trending/all/day", [
            'api_key' => $this->getTmdbKey(),
            'page' => 1,
        ]);
        if ($response->failed()) {
            return [];
        }
        return $response->json('results') ?? [];
    }

    /**
     * Multi-pool watch-together recommendations.
     *
     * - Weighted user actions: liked +5, saved +3, watched +1, disliked -10.
     * - Favorites are user markers only and do not affect ranking.
     * - Pool A: direct overlap in saved/liked for all participants.
     * - Pool B: genre affinity from liked titles.
     * - Pool C: trending fallback with disliked-genre suppression.
     */
    private function rankWatchTogetherForUsers(array $participantUserIds): \Illuminate\Support\Collection
    {
        if (empty($participantUserIds)) {
            return collect();
        }

        $participantCount = count($participantUserIds);
        $rows = Media::query()
            ->whereIn('user_id', $participantUserIds)
            ->get();

        $byKey = [];
        foreach ($rows as $row) {
            // Ignore stale rows that carry no active reaction signal.
            if (
                !$row->is_saved &&
                !$row->is_liked &&
                !$row->is_disliked &&
                $row->watched_at === null
            ) {
                continue;
            }
            // Ignore "only watched" rows. Keep watched titles only when there is
            // explicit intent (saved/liked/disliked) attached to that title.
            if (
                $row->watched_at !== null &&
                !$row->is_saved &&
                !$row->is_liked &&
                !$row->is_disliked
            ) {
                continue;
            }

            $key = "{$row->type}-{$row->tmdb_id}";
            if (!isset($byKey[$key])) {
                $byKey[$key] = [
                    'type' => $row->type,
                    'tmdb_id' => (int) $row->tmdb_id,
                    'sum' => 0,
                    'saved_count' => 0,
                    'liked_count' => 0,
                    'watched_count' => 0,
                    'disliked_count' => 0,
                    'users' => [],
                ];
            }
            $byKey[$key]['sum'] += $this->scoreUserRow($row);
            if ($row->is_saved) {
                $byKey[$key]['saved_count']++;
            }
            if ($row->is_liked) {
                $byKey[$key]['liked_count']++;
            }
            if ($row->watched_at !== null) {
                $byKey[$key]['watched_count']++;
            }
            if ($row->is_disliked) {
                $byKey[$key]['disliked_count']++;
            }
            // "Wants to watch" is primarily watchlist intent (saved). Also count
            // the strong positive combo watched+liked+favorited.
            if ($row->is_saved || ($row->watched_at !== null && $row->is_liked && $row->is_favorited)) {
                $byKey[$key]['users'][(int) $row->user_id] = true;
            }
        }

        $direct = collect();
        $groupInterest = collect();
        foreach ($byKey as $key => $item) {
            if ($item['disliked_count'] > 0) {
                continue;
            }
            if (count($item['users']) === 0) {
                continue;
            }
            $isFullOverlap = count($item['users']) === $participantCount;

            $confidence = 1 + (max(0, $item['saved_count'] - 1) * 0.15);
            $togetherScore = ($item['sum'] / max(1, $participantCount)) * $confidence;
            // Ensure titles saved by at least one participant rank above equal-score non-saved titles.
            if ($item['saved_count'] > 0) {
                $togetherScore += 2.0;
            }
            // Prioritize titles not watched by the group yet.
            $unwatchedCount = max(0, $participantCount - (int) $item['watched_count']);
            $togetherScore += ($unwatchedCount / max(1, $participantCount)) * 2.0;
            $togetherScore -= ($item['watched_count'] / max(1, $participantCount)) * 1.5;
            if ($item['watched_count'] === $participantCount && $item['liked_count'] === 0) {
                $togetherScore -= 2.5;
            }

            $badges = [];
            if ($item['watched_count'] > 0 && $item['watched_count'] < $participantCount) {
                $badges[] = 'New for some';
            }
            if ($item['watched_count'] === 0) {
                $badges[] = 'New to all of you';
            }
            if ($item['liked_count'] >= max(1, intdiv($participantCount + 1, 2))) {
                $badges[] = "Matches everyone's taste";
            }
            if ($item['saved_count'] > 0) {
                $badges[] = "On {$item['saved_count']} watchlist(s)";
            }
            $entry = [
                'type' => $item['type'],
                'tmdb_id' => $item['tmdb_id'],
                'together_score' => round($togetherScore, 3),
                'pool' => $isFullOverlap ? 'direct' : 'group_interest',
                'badges' => $badges,
                'watch_want_count' => count($item['users']),
                'watch_participant_count' => $participantCount,
                'watch_want_user_ids' => array_keys($item['users']),
            ];

            if ($isFullOverlap) {
                $direct->push($entry);
            } else {
                // Keep partial-overlap saved/liked titles visible after direct matches.
                $groupInterest->push($entry);
            }
        }
        $direct = $direct->sortByDesc('together_score')->values();
        $groupInterest = $groupInterest->sortByDesc('together_score')->values();

        $usedKeys = $direct
            ->concat($groupInterest)
            ->map(fn (array $i): string => "{$i['type']}-{$i['tmdb_id']}")
            ->flip();
        $interactedKeys = collect(array_keys($byKey))->flip();

        return $direct
            ->concat($groupInterest)
            ->values();
    }

    private function getAcceptedFriendIds(Request $request): \Illuminate\Support\Collection
    {
        $user = $request->user();
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

        return $friendIds;
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
        $rows = Media::query()
            ->where('user_id', $user->id)
            ->where('is_saved', true)
            ->get();

        if ($request->boolean('with_friends_social')) {
            $friendIds = $this->getAcceptedFriendIds($request);
            $sourceUserIds = collect([$user->id])->merge($friendIds)->unique()->values();

            $rows = $this->applySocialLibraryFilter(
                Media::query()->whereIn('user_id', $sourceUserIds->all())
            )->get()
                ->unique(fn (Media $item): string => "{$item->type}-{$item->tmdb_id}")
                ->values();
        }

        if ($request->boolean('with_friends_saved')) {
            $friendIds = $this->getAcceptedFriendIds($request);
            $participantIds = collect([$user->id])->merge($friendIds)->unique()->values()->all();
            $rows = $this->rankWatchTogetherForUsers($participantIds);
        }

        $results = [];
        foreach ($rows as $row) {
            $isRankedRow = is_array($row);
            $type = ($isRankedRow ? ($row['type'] ?? 'movie') : $row->type) === 'movie' ? 'movie' : 'tv';
            $tmdbId = (int) ($isRankedRow ? ($row['tmdb_id'] ?? 0) : $row->tmdb_id);
            $item = $this->fetchFromTmdb($type, $tmdbId);
            if ($item) {
                if ($isRankedRow) {
                    $item['together_score'] = $row['together_score'] ?? null;
                    $item['suggestion_pool'] = $row['pool'] ?? null;
                    $item['suggestion_badges'] = $row['badges'] ?? [];
                    $item['watch_want_count'] = $row['watch_want_count'] ?? null;
                    $item['watch_participant_count'] = $row['watch_participant_count'] ?? null;
                    $item['watch_want_user_ids'] = $row['watch_want_user_ids'] ?? [];
                }
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

    public function favorited(Request $request): JsonResponse
    {
        $user = $request->user();
        $rows = Media::where('user_id', $user->id)->where('is_favorited', true)->get();
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
            'is_favorited' => true,
        ]);
        return response()->json([
            'tmdb_id' => $row->tmdb_id,
            'media_type' => $row->type,
            'is_favorited' => true,
            'is_saved' => (bool) $row->is_saved,
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

    public function unwatched(MediaIdRequest $request): JsonResponse
    {
        $row = $this->updateOrCreate($request, [
            'watched_at' => null,
            'is_liked' => false,
            'is_disliked' => false,
        ]);
        return response()->json([
            'tmdb_id' => $row->tmdb_id,
            'media_type' => $row->type,
            'watched_at' => null,
            'is_liked' => false,
            'is_disliked' => false,
        ]);
    }
}
