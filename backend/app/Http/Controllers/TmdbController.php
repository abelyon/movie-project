<?php

namespace App\Http\Controllers;

use App\Models\Tmdb;
use App\Http\Requests\StoreTmdbRequest;
use App\Http\Requests\UpdateTmdbRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Request;

class TmdbController extends Controller
{
    public function discover(Request $request, $type)
    {
        $apiKey = config('services.tmdb.api_key');
        $url = $this->tmdbBaseUrl();

        if (!in_array($type, ['movie', 'tv'])) {
            return response()->json([
                'message' => 'Invalid get type. Must be "movie" or "tv".'
            ], 400);
        }

        $queryParams = [
            'api_key' => $apiKey,
            'page' => $request->query('page', 1),
            'sort_by' => $request->query('sort_by', 'popularity.desc'),
        ];

        $year = $request->query('year');
        if ($year !== null && $year !== '') {
            if ($type === 'movie') {
                $queryParams['primary_release_year'] = $year;
            } elseif ($type === 'tv') {
                $queryParams['first_air_date_year'] = $year;
            }
        }

        $personId = $request->query('person_id');
        if ($personId !== null && $personId !== '') {
            $queryParams['with_people'] = $personId;
        }

        $forwardKeys = [
            'watch_region',
            'with_watch_providers',
            'certification',
            'certification_country',
            'with_genres',
            'vote_average.gte',
            'vote_count.gte',
            'primary_release_date.gte',
            'first_air_date.gte',
        ];
        foreach ($forwardKeys as $key) {
            $val = $request->query($key);
            if ($val !== null && $val !== '') {
                $queryParams[$key] = $val;
            }
        }

        $response = Http::get("{$url}/discover/{$type}", $queryParams);

        if ($response->failed()) {
            return response()->json([
                'message' => 'Failed to fetch data from TMDB',
            ], $response->status());
        }

        return response()->json($response->json(), 200);
    }

    public function watchProvidersCatalog(Request $request, string $type)
    {
        if (!in_array($type, ['movie', 'tv'], true)) {
            return response()->json(['message' => 'Invalid type.'], 400);
        }

        $apiKey = config('services.tmdb.api_key');
        if ($apiKey === null || $apiKey === '') {
            return response()->json(['message' => 'TMDB API key is not configured'], 503);
        }

        $url = $this->tmdbBaseUrl();
        $region = strtoupper((string) $request->query('watch_region', 'US'));
        if (strlen($region) !== 2) {
            return response()->json(['message' => 'watch_region must be a 2-letter ISO code.'], 400);
        }

        $response = Http::acceptJson()->get("{$url}/watch/providers/{$type}", [
            'api_key' => $apiKey,
        ]);

        $payload = $response->json();
        if ($response->failed() || !is_array($payload) || !isset($payload['results']) || !is_array($payload['results'])) {
            return response()->json(
                ['message' => 'Failed to fetch watch providers from TMDB'],
                $response->failed() ? $response->status() : 502,
            );
        }

        $regionData = $this->tmdbRegionPayload($payload['results'], $region);

        return response()->json([
            'watch_region' => $region,
            'flatrate' => is_array($regionData) ? ($regionData['flatrate'] ?? []) : [],
            'rent' => is_array($regionData) ? ($regionData['rent'] ?? []) : [],
            'buy' => is_array($regionData) ? ($regionData['buy'] ?? []) : [],
        ]);
    }

    public function certifications(Request $request, string $type)
    {
        if (!in_array($type, ['movie', 'tv'], true)) {
            return response()->json(['message' => 'Invalid type.'], 400);
        }

        $apiKey = config('services.tmdb.api_key');
        $url = $this->tmdbBaseUrl();
        $path = $type === 'tv' ? 'certification/tv/list' : 'certification/movie/list';

        $response = Http::get("{$url}/{$path}", [
            'api_key' => $apiKey,
        ]);

        if ($response->failed()) {
            return response()->json(['message' => 'Failed to fetch certifications from TMDB'], $response->status());
        }

        return response()->json($response->json(), 200);
    }

    public function movieWatchProviders(Request $request, int $id)
    {
        return $this->mediaWatchProviders($request, 'movie', $id);
    }

    public function tvWatchProviders(Request $request, int $id)
    {
        return $this->mediaWatchProviders($request, 'tv', $id);
    }

    public function movieCertification(Request $request, int $id)
    {
        $apiKey = config('services.tmdb.api_key');
        if ($apiKey === null || $apiKey === '') {
            return response()->json(['message' => 'TMDB API key is not configured'], 503);
        }
        $url = $this->tmdbBaseUrl();
        $region = strtoupper((string) $request->query('watch_region', 'US'));
        if (strlen($region) !== 2) {
            return response()->json(['message' => 'watch_region must be a 2-letter ISO code.'], 400);
        }

        $response = Http::acceptJson()->get("{$url}/movie/{$id}/release_dates", [
            'api_key' => $apiKey,
        ]);

        if ($response->failed()) {
            return response()->json(['message' => 'Failed to fetch release dates from TMDB'], $response->status());
        }

        $json = $response->json();
        $payload = is_array($json) ? $json : [];
        $cert = $this->extractMovieCertificationFromReleaseDates($payload, $region);

        return response()->json([
            'watch_region' => $region,
            'certification' => $cert,
        ], 200);
    }

    public function tvCertification(Request $request, int $id)
    {
        $apiKey = config('services.tmdb.api_key');
        if ($apiKey === null || $apiKey === '') {
            return response()->json(['message' => 'TMDB API key is not configured'], 503);
        }
        $url = $this->tmdbBaseUrl();
        $region = strtoupper((string) $request->query('watch_region', 'US'));
        if (strlen($region) !== 2) {
            return response()->json(['message' => 'watch_region must be a 2-letter ISO code.'], 400);
        }

        $response = Http::acceptJson()->get("{$url}/tv/{$id}/content_ratings", [
            'api_key' => $apiKey,
        ]);

        if ($response->failed()) {
            return response()->json(['message' => 'Failed to fetch TV content ratings from TMDB'], $response->status());
        }

        $json = $response->json();
        $results = is_array($json) && isset($json['results']) && is_array($json['results'])
            ? $json['results']
            : [];
        $cert = null;
        foreach ($results as $row) {
            if (! is_array($row)) {
                continue;
            }
            if (strtoupper((string) ($row['iso_3166_1'] ?? '')) !== $region) {
                continue;
            }
            $rating = trim((string) ($row['rating'] ?? ''));
            if ($rating !== '') {
                $cert = $rating;
                break;
            }
        }

        return response()->json([
            'watch_region' => $region,
            'certification' => $cert,
        ], 200);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function extractMovieCertificationFromReleaseDates(array $payload, string $region): ?string
    {
        $upper = strtoupper($region);
        foreach ($payload['results'] ?? [] as $block) {
            if (! is_array($block)) {
                continue;
            }
            if (strtoupper((string) ($block['iso_3166_1'] ?? '')) !== $upper) {
                continue;
            }
            $dates = $block['release_dates'] ?? [];
            if (! is_array($dates)) {
                continue;
            }
            $preferred = [];
            $fallback = [];
            foreach ($dates as $d) {
                if (! is_array($d)) {
                    continue;
                }
                $c = trim((string) ($d['certification'] ?? ''));
                if ($c === '' || strtoupper($c) === 'NR') {
                    continue;
                }
                $type = (int) ($d['type'] ?? 0);
                if ($type === 3) {
                    $preferred[] = $c;
                } else {
                    $fallback[] = $c;
                }
            }
            if ($preferred !== []) {
                return $preferred[0];
            }
            if ($fallback !== []) {
                return $fallback[0];
            }
        }

        return null;
    }

    private function mediaWatchProviders(Request $request, string $type, int $id)
    {
        if (!in_array($type, ['movie', 'tv'], true)) {
            return response()->json(['message' => 'Invalid type.'], 400);
        }

        $apiKey = config('services.tmdb.api_key');
        $url = $this->tmdbBaseUrl();
        $region = strtoupper((string) $request->query('watch_region', 'US'));
        if (strlen($region) !== 2) {
            return response()->json(['message' => 'watch_region must be a 2-letter ISO code.'], 400);
        }

        $response = Http::acceptJson()->get("{$url}/{$type}/{$id}/watch/providers", [
            'api_key' => $apiKey,
        ]);

        if ($response->failed()) {
            return response()->json(['message' => 'Failed to fetch watch providers from TMDB'], $response->status());
        }

        $payload = $response->json();
        $results = is_array($payload) && isset($payload['results']) && is_array($payload['results'])
            ? $payload['results']
            : [];
        $slice = $this->tmdbRegionPayload($results, $region);
        $ids = [];
        if (is_array($slice)) {
            foreach (['flatrate', 'rent', 'buy'] as $bucket) {
                if (!isset($slice[$bucket]) || !is_array($slice[$bucket])) {
                    continue;
                }
                foreach ($slice[$bucket] as $row) {
                    if (isset($row['provider_id'])) {
                        $ids[] = (int) $row['provider_id'];
                    }
                }
            }
        }

        return response()->json([
            'watch_region' => $region,
            'provider_ids' => array_values(array_unique($ids)),
        ]);
    }

    public function searchPeople(Request $request)
    {
        $apiKey = config('services.tmdb.api_key');
        $url = $this->tmdbBaseUrl();
        $query = trim((string) $request->query('query', ''));

        if (strlen($query) < 2) {
            return response()->json([
                'results' => [],
                'page' => 1,
                'total_pages' => 0,
                'total_results' => 0,
            ], 200);
        }

        $response = Http::get("{$url}/search/person", [
            'api_key' => $apiKey,
            'query' => $query,
            'page' => $request->query('page', 1),
            'include_adult' => false,
        ]);

        if ($response->failed()) {
            return response()->json([
                'message' => 'Failed to fetch people from TMDB',
            ], $response->status());
        }

        return response()->json($response->json(), 200);
    }

    public function search(Request $request)
    {
        $apiKey = config('services.tmdb.api_key');
        $url = $this->tmdbBaseUrl();

        $queryParams = [
            'api_key' => $apiKey,
            'query' => $request->query('query'),
        ];

        $response = Http::get("{$url}/search/multi", $queryParams);
        
        return response()->json($response->json(), 200);
    }

    public function trending(Request $request)
    {
        $apiKey = config('services.tmdb.api_key');
        $url = $this->tmdbBaseUrl();

        $queryParams = [
            'api_key' => $apiKey,
            'page' => $request->query('page', 1),
        ];

        $response = Http::get("{$url}/trending/all/day", $queryParams);

        return response()->json($response->json(), 200);
    }

    public function movie(Request $request, $id) {
        $apiKey = config('services.tmdb.api_key');
        $url = $this->tmdbBaseUrl();
        $region = strtoupper((string) $request->query('watch_region', 'US'));
        if (strlen($region) !== 2) {
            $region = 'US';
        }

        $response = Http::get("{$url}/movie/{$id}", [
            'api_key' => $apiKey,
            'append_to_response' => 'credits,watch/providers,videos,recommendations',
        ]);
        $json = $response->json();
        $mid = (int) $id;
        $wp = $json['watch/providers'] ?? null;
        $byCountry = is_array($wp) && isset($wp['results']) && is_array($wp['results']) ? $wp['results'] : null;
        $watchProviders = $this->tmdbRegionPayload($byCountry, $region);
        unset($json['watch/providers']);
        $json['watch_providers'] = $watchProviders;
        $json['cast'] = $json['credits']['cast'] ?? [];
        unset($json['credits']);
        $videos = $json['videos'] ?? null;
        unset($json['videos']);
        $json['trailer_youtube_key'] = is_array($videos) ? $this->pickYoutubeTrailerKey($videos) : null;
        $reco = $json['recommendations'] ?? null;
        unset($json['recommendations']);
        $json['recommendations'] = is_array($reco)
            ? $this->normalizeMediaRecommendationRows($reco, 'movie', $mid)
            : [];

        return response()->json($json, 200);
    }

    public function tv(Request $request, $id) {
        $apiKey = config('services.tmdb.api_key');
        $url = $this->tmdbBaseUrl();
        $region = strtoupper((string) $request->query('watch_region', 'US'));
        if (strlen($region) !== 2) {
            $region = 'US';
        }

        $response = Http::get("{$url}/tv/{$id}", [
            'api_key' => $apiKey,
            'append_to_response' => 'credits,watch/providers,videos,recommendations',
        ]);
        $json = $response->json();
        $tid = (int) $id;
        $wp = $json['watch/providers'] ?? null;
        $byCountry = is_array($wp) && isset($wp['results']) && is_array($wp['results']) ? $wp['results'] : null;
        $watchProviders = $this->tmdbRegionPayload($byCountry, $region);
        unset($json['watch/providers']);
        $json['watch_providers'] = $watchProviders;
        $json['cast'] = $json['credits']['cast'] ?? [];
        unset($json['credits']);
        $videos = $json['videos'] ?? null;
        unset($json['videos']);
        $json['trailer_youtube_key'] = is_array($videos) ? $this->pickYoutubeTrailerKey($videos) : null;
        $reco = $json['recommendations'] ?? null;
        unset($json['recommendations']);
        $json['recommendations'] = is_array($reco)
            ? $this->normalizeMediaRecommendationRows($reco, 'tv', $tid)
            : [];

        return response()->json($json, 200);
    }

    /**
     * TMDB movie/tv recommendations (taste-based). Slim rows for the detail grid carousel.
     *
     * @param  array<string, mixed>  $recoPayload
     * @return array<int, array<string, mixed>>
     */
    private function normalizeMediaRecommendationRows(array $recoPayload, string $mediaType, int $excludeId): array
    {
        if (! in_array($mediaType, ['movie', 'tv'], true)) {
            return [];
        }

        $results = $recoPayload['results'] ?? [];
        if (! is_array($results)) {
            return [];
        }

        $out = [];
        foreach ($results as $row) {
            if (! is_array($row)) {
                continue;
            }
            $rid = (int) ($row['id'] ?? 0);
            if ($rid === 0 || $rid === $excludeId) {
                continue;
            }

            $genreIds = [];
            if (isset($row['genre_ids']) && is_array($row['genre_ids'])) {
                foreach ($row['genre_ids'] as $gid) {
                    $genreIds[] = (int) $gid;
                }
            }

            $poster = $row['poster_path'] ?? null;
            $out[] = [
                'id' => $rid,
                'media_type' => $mediaType,
                'title' => $row['title'] ?? null,
                'name' => $row['name'] ?? null,
                'poster_path' => $poster !== null && $poster !== '' ? $poster : null,
                'backdrop_path' => $row['backdrop_path'] ?? null,
                'overview' => $row['overview'] ?? null,
                'vote_average' => isset($row['vote_average']) ? (float) $row['vote_average'] : null,
                'release_date' => $row['release_date'] ?? null,
                'first_air_date' => $row['first_air_date'] ?? null,
                'genre_ids' => $genreIds,
            ];
            if (count($out) >= 20) {
                break;
            }
        }

        return $out;
    }

    /**
     * Prefer official YouTube Trailer, then Teaser, etc.
     *
     * @param  array<string, mixed>  $videosPayload
     */
    private function pickYoutubeTrailerKey(array $videosPayload): ?string
    {
        $results = $videosPayload['results'] ?? [];
        if (! is_array($results) || $results === []) {
            return null;
        }

        $youtube = [];
        foreach ($results as $v) {
            if (! is_array($v)) {
                continue;
            }
            if (($v['site'] ?? '') !== 'YouTube') {
                continue;
            }
            $key = trim((string) ($v['key'] ?? ''));
            if ($key === '') {
                continue;
            }
            $youtube[] = $v;
        }

        if ($youtube === []) {
            return null;
        }

        $typeRank = [
            'Trailer' => 0,
            'Teaser' => 1,
            'Clip' => 2,
            'Featurette' => 3,
            'Behind the Scenes' => 4,
        ];

        usort($youtube, function ($a, $b) use ($typeRank) {
            if (! is_array($a) || ! is_array($b)) {
                return 0;
            }
            $ta = (string) ($a['type'] ?? '');
            $tb = (string) ($b['type'] ?? '');
            $ra = $typeRank[$ta] ?? 50;
            $rb = $typeRank[$tb] ?? 50;
            if ($ra !== $rb) {
                return $ra <=> $rb;
            }
            $oa = ! empty($a['official']) ? 0 : 1;
            $ob = ! empty($b['official']) ? 0 : 1;

            return $oa <=> $ob;
        });

        $first = $youtube[0] ?? null;

        if (! is_array($first)) {
            return null;
        }
        $key = trim((string) ($first['key'] ?? ''));

        return $key !== '' ? $key : null;
    }

    public function person($id)
    {
        $apiKey = config('services.tmdb.api_key');
        $url = $this->tmdbBaseUrl();

        $response = Http::get("{$url}/person/{$id}", [
            'api_key' => $apiKey,
            'append_to_response' => 'combined_credits',
        ]);

        if ($response->failed()) {
            return response()->json([
                'message' => 'Failed to fetch person from TMDB',
            ], $response->status());
        }

        $json = $response->json();
        $combined = $json['combined_credits'] ?? [];
        $castCredits = is_array($combined) ? ($combined['cast'] ?? []) : [];
        $crewCredits = is_array($combined) ? ($combined['crew'] ?? []) : [];
        unset($json['combined_credits']);

        $filteredCredits = array_values(array_filter($castCredits, function ($item) {
            $mediaType = $item['media_type'] ?? null;

            return in_array($mediaType, ['movie', 'tv'], true);
        }));

        usort($filteredCredits, function ($a, $b) {
            $aDate = $a['release_date'] ?? $a['first_air_date'] ?? '';
            $bDate = $b['release_date'] ?? $b['first_air_date'] ?? '';

            return strcmp($bDate, $aDate);
        });

        $json['credits'] = array_values(array_filter(array_map(
            fn ($row) => is_array($row) ? $this->normalizePersonCreditRow($row) : null,
            $filteredCredits
        )));

        $directingRaw = array_values(array_filter($crewCredits, function ($item) {
            if (! is_array($item)) {
                return false;
            }
            $mediaType = $item['media_type'] ?? null;
            if (! in_array($mediaType, ['movie', 'tv'], true)) {
                return false;
            }
            $job = (string) ($item['job'] ?? '');
            $directorJobs = ['Director', 'Co-Director', 'Series Director'];

            return in_array($job, $directorJobs, true);
        }));

        $directingSeen = [];
        $directingUnique = [];
        foreach ($directingRaw as $row) {
            if (! is_array($row)) {
                continue;
            }
            $mid = (int) ($row['id'] ?? 0);
            $mt = (string) ($row['media_type'] ?? '');
            $key = $mt.'-'.$mid;
            if ($mid === 0 || $key === '-' || isset($directingSeen[$key])) {
                continue;
            }
            $directingSeen[$key] = true;
            $directingUnique[] = $row;
        }

        usort($directingUnique, function ($a, $b) {
            $aDate = $a['release_date'] ?? $a['first_air_date'] ?? '';
            $bDate = $b['release_date'] ?? $b['first_air_date'] ?? '';

            return strcmp($bDate, $aDate);
        });

        $json['directing_credits'] = array_values(array_filter(array_map(
            fn ($row) => is_array($row) ? $this->normalizePersonCreditRow($row) : null,
            $directingUnique
        )));

        return response()->json($json, 200);
    }

    /**
     * @param  array<string, mixed>  $item
     * @return array<string, mixed>|null
     */
    private function normalizePersonCreditRow(array $item): ?array
    {
        $mediaType = $item['media_type'] ?? null;
        if (! in_array($mediaType, ['movie', 'tv'], true)) {
            return null;
        }
        $id = (int) ($item['id'] ?? 0);
        if ($id === 0) {
            return null;
        }

        return [
            'id' => $id,
            'media_type' => $mediaType,
            'title' => $item['title'] ?? null,
            'name' => $item['name'] ?? null,
            'poster_path' => $item['poster_path'] ?? null,
            'backdrop_path' => $item['backdrop_path'] ?? null,
            'overview' => $item['overview'] ?? null,
            'vote_average' => isset($item['vote_average']) ? (float) $item['vote_average'] : null,
            'release_date' => $item['release_date'] ?? null,
            'first_air_date' => $item['first_air_date'] ?? null,
        ];
    }

    private function tmdbBaseUrl(): string
    {
        return rtrim((string) config('services.tmdb.url'), '/');
    }

    /**
     * TMDB country keys in watch-provider maps may not match PHP array casing; resolve case-insensitively.
     *
     * @param  array<string, mixed>|null  $resultsByCountry
     * @return array<string, mixed>|null
     */
    private function tmdbRegionPayload(?array $resultsByCountry, string $region): ?array
    {
        if ($resultsByCountry === null || $resultsByCountry === []) {
            return null;
        }

        $upper = strtoupper($region);
        if (isset($resultsByCountry[$upper]) && is_array($resultsByCountry[$upper])) {
            return $resultsByCountry[$upper];
        }
        if (isset($resultsByCountry[$region]) && is_array($resultsByCountry[$region])) {
            return $resultsByCountry[$region];
        }

        foreach ($resultsByCountry as $code => $payload) {
            if (is_array($payload) && strtoupper((string) $code) === $upper) {
                return $payload;
            }
        }

        return null;
    }
}
