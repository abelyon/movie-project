<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

class TmdbController extends Controller
{
    private function normalizeCertification(?string $raw): ?string
    {
        if ($raw === null || $raw === '') {
            return null;
        }
        $upper = strtoupper(trim($raw));
        $map = [
            'G' => '6', 'PG' => '6', 'TV-Y' => '6', 'TV-G' => '6', 'TV-Y7' => '6', 'TV-Y7-FV' => '6', 'TV-PG' => '6',
            'PG-13' => '12', 'TV-14' => '12',
            'R' => '16', 'TV-MA' => '16',
            'NC-17' => '18',
        ];
        if (isset($map[$upper])) {
            return $map[$upper];
        }
        if (ctype_digit($raw)) {
            $n = (int) $raw;
            if ($n <= 6) return '6';
            if ($n <= 12) return '12';
            if ($n <= 16) return '16';
            if ($n <= 18) return '18';
            return '18';
        }
        return null;
    }

    private function certificationFromMovieResponse(array $data): ?string
    {
        $results = $data['results'] ?? [];
        $fallback = null;
        foreach ($results as $r) {
            $country = $r['iso_3166_1'] ?? '';
            foreach ($r['release_dates'] ?? [] as $rel) {
                if (empty($rel['certification'])) {
                    continue;
                }
                $cert = $this->normalizeCertification($rel['certification']);
                if ($cert !== null) {
                    if ($country === 'US') {
                        return $cert;
                    }
                    if ($fallback === null) {
                        $fallback = $cert;
                    }
                }
            }
        }
        return $fallback;
    }

    private function certificationFromTvResponse(array $data): ?string
    {
        $results = $data['results'] ?? [];
        $fallback = null;
        foreach ($results as $r) {
            if (empty($r['rating'])) {
                continue;
            }
            $cert = $this->normalizeCertification($r['rating']);
            if ($cert !== null) {
                if (($r['iso_3166_1'] ?? '') === 'US') {
                    return $cert;
                }
                if ($fallback === null) {
                    $fallback = $cert;
                }
            }
        }
        return $fallback;
    }

    private function enrichWithCertifications(array $items): array
    {
        $limit = 20;
        if (empty($items) || empty(env('TMDB_API_KEY'))) {
            return $items;
        }

        $toEnrich = array_slice($items, 0, $limit);
        $apiKey = env('TMDB_API_KEY');

        try {
            $responses = Http::pool(function ($pool) use ($toEnrich, $apiKey) {
                foreach ($toEnrich as $item) {
                    $type = $item['media_type'] ?? 'movie';
                    $id = (int) ($item['id'] ?? 0);
                    if ($id < 1) {
                        continue;
                    }
                    $key = $type . '-' . $id;
                    $url = $type === 'movie'
                        ? "https://api.themoviedb.org/3/movie/{$id}/release_dates"
                        : "https://api.themoviedb.org/3/tv/{$id}/content_ratings";
                    $pool->as($key)->get($url, ['api_key' => $apiKey]);
                }
            });
        } catch (\Throwable $e) {
            return $items;
        }

        foreach ($items as $i => &$item) {
            $item['certification'] = null;
            $key = ($item['media_type'] ?? 'movie') . '-' . ($item['id'] ?? 0);
            $certResponse = $responses[$key] ?? null;

            if (!$certResponse instanceof Response || !$certResponse->successful()) {
                continue;
            }

            $data = $certResponse->json();
            $type = $item['media_type'] ?? 'movie';
            $item['certification'] = $type === 'movie'
                ? $this->certificationFromMovieResponse($data)
                : $this->certificationFromTvResponse($data);
        }

        return $items;
    }

    public function popular(Request $request)
    {
        $page = $request->query('page', 1);

        $moviesResponse = Http::get('https://api.themoviedb.org/3/movie/popular', [
            'api_key' => env('TMDB_API_KEY'),
            'page' => $page,
        ])->json();
        $movies = $moviesResponse['results'] ?? [];
        $moviesTotalPages = $moviesResponse['total_pages'] ?? 500;

        $showsResponse = Http::get('https://api.themoviedb.org/3/tv/popular', [
            'api_key' => env('TMDB_API_KEY'),
            'page' => $page,
        ])->json();
        $shows = $showsResponse['results'] ?? [];
        $showsTotalPages = $showsResponse['total_pages'] ?? 500;

        $mixed = array_merge(
            array_map(fn($m) => $m + ['media_type' => 'movie'], $movies),
            array_map(fn($s) => $s + ['media_type' => 'tv'], $shows),
        );
        usort($mixed, fn($a, $b) => ($b['popularity'] ?? 0) <=> ($a['popularity'] ?? 0));

        $mixed = $this->enrichWithCertifications($mixed);

        $totalPages = min($moviesTotalPages, $showsTotalPages);

        return response()->json(['results' => $mixed, 'total_pages' => $totalPages]);
    }

    public function search(Request $request)
    {
        $query = trim($request->query('query', ''));
        $page = $request->query('page', 1);

        if ($query === '') {
            return response()->json(['results' => [], 'total_pages' => 0]);
        }

        $response = Http::get('https://api.themoviedb.org/3/search/multi', [
            'api_key' => env('TMDB_API_KEY'),
            'query' => $query,
            'page' => $page,
        ])->json();
        $results = $response['results'] ?? [];
        $totalPages = $response['total_pages'] ?? 0;

        $filtered = array_values(array_filter($results, function ($item) {
            $type = $item['media_type'] ?? '';
            return $type === 'movie' || $type === 'tv';
        }));

        $normalized = array_map(function ($item) {
            if (($item['media_type'] ?? '') === 'tv') {
                $item['media_type'] = 'tv';
            }
            return $item;
        }, $filtered);

        $normalized = $this->enrichWithCertifications($normalized);

        return response()->json(['results' => $normalized, 'total_pages' => $totalPages]);
    }

    public function genres()
    {
        $movieGenres = Http::get('https://api.themoviedb.org/3/genre/movie/list', [
            'api_key' => env('TMDB_API_KEY'),
        ])->json()['genres'] ?? [];
        $tvGenres = Http::get('https://api.themoviedb.org/3/genre/tv/list', [
            'api_key' => env('TMDB_API_KEY'),
        ])->json()['genres'] ?? [];

        $genres = array_merge(
            array_map(fn ($g) => $g + ['type' => 'movie'], $movieGenres),
            array_map(fn ($g) => $g + ['type' => 'tv'], $tvGenres),
        );

        return response()->json(['genres' => $genres]);
    }

    public function discover(Request $request)
    {
        $page = (int) $request->query('page', 1);
        $genreIds = array_filter(array_map('intval', explode(',', $request->query('with_genres', ''))));
        if (empty($genreIds)) {
            return response()->json(['results' => [], 'total_pages' => 0]);
        }

        $movieGenres = Http::get('https://api.themoviedb.org/3/genre/movie/list', [
            'api_key' => env('TMDB_API_KEY'),
        ])->json()['genres'] ?? [];
        $tvGenres = Http::get('https://api.themoviedb.org/3/genre/tv/list', [
            'api_key' => env('TMDB_API_KEY'),
        ])->json()['genres'] ?? [];
        $movieIds = array_column($movieGenres, 'id');
        $tvIds = array_column($tvGenres, 'id');

        $movieGenreIds = array_values(array_intersect($genreIds, $movieIds));
        $tvGenreIds = array_values(array_intersect($genreIds, $tvIds));

        $movies = [];
        $moviesTotalPages = 0;
        if (!empty($movieGenreIds)) {
            $withGenres = implode('|', $movieGenreIds);
            $res = Http::get('https://api.themoviedb.org/3/discover/movie', [
                'api_key' => env('TMDB_API_KEY'),
                'page' => $page,
                'with_genres' => $withGenres,
            ])->json();
            $movies = $res['results'] ?? [];
            $moviesTotalPages = $res['total_pages'] ?? 1;
        }

        $shows = [];
        $showsTotalPages = 0;
        if (!empty($tvGenreIds)) {
            $withGenres = implode('|', $tvGenreIds);
            $res = Http::get('https://api.themoviedb.org/3/discover/tv', [
                'api_key' => env('TMDB_API_KEY'),
                'page' => $page,
                'with_genres' => $withGenres,
            ])->json();
            $shows = $res['results'] ?? [];
            $showsTotalPages = $res['total_pages'] ?? 1;
        }

        $mixed = array_merge(
            array_map(fn ($m) => $m + ['media_type' => 'movie'], $movies),
            array_map(fn ($s) => $s + ['media_type' => 'tv'], $shows),
        );
        usort($mixed, fn ($a, $b) => ($b['popularity'] ?? 0) <=> ($a['popularity'] ?? 0));

        $mixed = $this->enrichWithCertifications($mixed);

        $totalPages = max($moviesTotalPages, $showsTotalPages);

        return response()->json(['results' => $mixed, 'total_pages' => $totalPages]);
    }

    public function detail(string $type, int $id)
    {
        $endpoint = $type === 'movie'
            ? "https://api.themoviedb.org/3/movie/{$id}"
            : "https://api.themoviedb.org/3/tv/{$id}";

        $data = Http::get($endpoint, [
            'api_key' => env('TMDB_API_KEY'),
        ])->json();

        if (empty($data) || isset($data['success']) && !$data['success']) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $data['media_type'] = $type;

        $certEndpoint = $type === 'movie'
            ? "https://api.themoviedb.org/3/movie/{$id}/release_dates"
            : "https://api.themoviedb.org/3/tv/{$id}/content_ratings";

        $certResponse = Http::get($certEndpoint, [
            'api_key' => env('TMDB_API_KEY'),
        ])->json();

        if ($type === 'movie' && !empty($certResponse['results'])) {
            foreach ($certResponse['results'] ?? [] as $r) {
                if (($r['iso_3166_1'] ?? '') === 'US') {
                    $releases = $r['release_dates'] ?? [];
                    foreach ($releases as $rel) {
                        if (!empty($rel['certification'])) {
                            $data['certification'] = $this->normalizeCertification($rel['certification']);
                            break 2;
                        }
                    }
                }
            }
        } elseif ($type === 'tv' && !empty($certResponse['results'])) {
            foreach ($certResponse['results'] ?? [] as $r) {
                if (($r['iso_3166_1'] ?? '') === 'US' && !empty($r['rating'])) {
                    $data['certification'] = $this->normalizeCertification($r['rating']);
                    break;
                }
            }
        }

        return response()->json($data);
    }

    /**
     * Fetch full TMDB details (with certification) for multiple items in parallel.
     * @param array<int, array{media_type: string, tmdb_id: int}> $items
     * @return array<string, array> Keyed by "media_type-tmdb_id"
     */
    public function fetchDetailsBatch(array $items): array
    {
        if (empty($items) || empty(env('TMDB_API_KEY'))) {
            return [];
        }

        $apiKey = env('TMDB_API_KEY');
        $detailResponses = [];
        $certResponses = [];

        try {
            $detailResponses = Http::pool(function ($pool) use ($items, $apiKey) {
                $arr = [];
                foreach ($items as $item) {
                    $type = $item['media_type'] ?? 'movie';
                    $id = (int) ($item['tmdb_id'] ?? 0);
                    if ($id < 1) {
                        continue;
                    }
                    $key = $type . '-' . $id;
                    $url = $type === 'movie'
                        ? "https://api.themoviedb.org/3/movie/{$id}"
                        : "https://api.themoviedb.org/3/tv/{$id}";
                    $arr[$key] = $pool->as($key)->get($url, ['api_key' => $apiKey]);
                }
                return $arr;
            });

            $certResponses = Http::pool(function ($pool) use ($items, $apiKey) {
                $arr = [];
                foreach ($items as $item) {
                    $type = $item['media_type'] ?? 'movie';
                    $id = (int) ($item['tmdb_id'] ?? 0);
                    if ($id < 1) {
                        continue;
                    }
                    $key = $type . '-' . $id;
                    $url = $type === 'movie'
                        ? "https://api.themoviedb.org/3/movie/{$id}/release_dates"
                        : "https://api.themoviedb.org/3/tv/{$id}/content_ratings";
                    $arr[$key] = $pool->as($key)->get($url, ['api_key' => $apiKey]);
                }
                return $arr;
            });
        } catch (\Throwable $e) {
            return [];
        }

        $out = [];
        foreach ($items as $item) {
            $type = $item['media_type'] ?? 'movie';
            $id = (int) ($item['tmdb_id'] ?? 0);
            $key = $type . '-' . $id;

            $detailRes = $detailResponses[$key] ?? null;
            if (!$detailRes instanceof Response || !$detailRes->successful()) {
                continue;
            }
            $data = $detailRes->json();
            if (empty($data) || (isset($data['success']) && !$data['success'])) {
                continue;
            }
            $data['media_type'] = $type;

            $certRes = $certResponses[$key] ?? null;
            if ($certRes instanceof Response && $certRes->successful()) {
                $certData = $certRes->json();
                if ($type === 'movie' && !empty($certData['results'])) {
                    foreach ($certData['results'] ?? [] as $r) {
                        if (($r['iso_3166_1'] ?? '') === 'US') {
                            foreach ($r['release_dates'] ?? [] as $rel) {
                                if (!empty($rel['certification'])) {
                                    $data['certification'] = $this->normalizeCertification($rel['certification']);
                                    break 2;
                                }
                            }
                        }
                    }
                } elseif ($type === 'tv' && !empty($certData['results'])) {
                    foreach ($certData['results'] ?? [] as $r) {
                        if (($r['iso_3166_1'] ?? '') === 'US' && !empty($r['rating'])) {
                            $data['certification'] = $this->normalizeCertification($r['rating']);
                            break;
                        }
                    }
                }
            }

            $out[$key] = $data;
        }

        return $out;
    }
}