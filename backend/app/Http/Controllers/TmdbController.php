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
        $url = config('services.tmdb.url');

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
        $url = config('services.tmdb.url');
        $region = strtoupper((string) $request->query('watch_region', 'US'));
        if (strlen($region) !== 2) {
            return response()->json(['message' => 'watch_region must be a 2-letter ISO code.'], 400);
        }

        $response = Http::get("{$url}/watch/providers/{$type}", [
            'api_key' => $apiKey,
        ]);

        if ($response->failed()) {
            return response()->json(['message' => 'Failed to fetch watch providers from TMDB'], $response->status());
        }

        $results = $response->json('results') ?? [];
        $regionData = $results[$region] ?? null;

        return response()->json([
            'watch_region' => $region,
            'flatrate' => $regionData['flatrate'] ?? [],
            'rent' => $regionData['rent'] ?? [],
            'buy' => $regionData['buy'] ?? [],
        ]);
    }

    public function certifications(Request $request, string $type)
    {
        if (!in_array($type, ['movie', 'tv'], true)) {
            return response()->json(['message' => 'Invalid type.'], 400);
        }

        $apiKey = config('services.tmdb.api_key');
        $url = config('services.tmdb.url');
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

    private function mediaWatchProviders(Request $request, string $type, int $id)
    {
        if (!in_array($type, ['movie', 'tv'], true)) {
            return response()->json(['message' => 'Invalid type.'], 400);
        }

        $apiKey = config('services.tmdb.api_key');
        $url = config('services.tmdb.url');
        $region = strtoupper((string) $request->query('watch_region', 'US'));
        if (strlen($region) !== 2) {
            return response()->json(['message' => 'watch_region must be a 2-letter ISO code.'], 400);
        }

        $response = Http::get("{$url}/{$type}/{$id}/watch/providers", [
            'api_key' => $apiKey,
        ]);

        if ($response->failed()) {
            return response()->json(['message' => 'Failed to fetch watch providers from TMDB'], $response->status());
        }

        $results = $response->json('results') ?? [];
        $slice = $results[$region] ?? null;
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
        $url = config('services.tmdb.url');
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
        $url = config('services.tmdb.url');

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
        $url = config('services.tmdb.url');

        $queryParams = [
            'api_key' => $apiKey,
            'page' => $request->query('page', 1),
        ];

        $response = Http::get("{$url}/trending/all/day", $queryParams);

        return response()->json($response->json(), 200);
    }

    public function movie(Request $request, $id) {
        $apiKey = config('services.tmdb.api_key');
        $url = config('services.tmdb.url');
        $region = strtoupper((string) $request->query('watch_region', 'US'));
        if (strlen($region) !== 2) {
            $region = 'US';
        }

        $response = Http::get("{$url}/movie/{$id}", [
            'api_key' => $apiKey,
            'append_to_response' => 'credits,watch/providers',
        ]);
        $json = $response->json();
        $watchProviders = $json['watch/providers']['results'][$region] ?? null;
        unset($json['watch/providers']);
        $json['watch_providers'] = $watchProviders;
        $json['cast'] = $json['credits']['cast'] ?? [];
        unset($json['credits']);

        return response()->json($json, 200);
    }

    public function tv(Request $request, $id) {
        $apiKey = config('services.tmdb.api_key');
        $url = config('services.tmdb.url');
        $region = strtoupper((string) $request->query('watch_region', 'US'));
        if (strlen($region) !== 2) {
            $region = 'US';
        }

        $response = Http::get("{$url}/tv/{$id}", [
            'api_key' => $apiKey,
            'append_to_response' => 'credits,watch/providers',
        ]);
        $json = $response->json();
        $watchProviders = $json['watch/providers']['results'][$region] ?? null;
        unset($json['watch/providers']);
        $json['watch_providers'] = $watchProviders;
        $json['cast'] = $json['credits']['cast'] ?? [];
        unset($json['credits']);

        return response()->json($json, 200);
    }

    public function person($id)
    {
        $apiKey = config('services.tmdb.api_key');
        $url = config('services.tmdb.url');

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
        $credits = $json['combined_credits']['cast'] ?? [];
        unset($json['combined_credits']);

        $filteredCredits = array_values(array_filter($credits, function ($item) {
            $mediaType = $item['media_type'] ?? null;
            return in_array($mediaType, ['movie', 'tv'], true);
        }));

        usort($filteredCredits, function ($a, $b) {
            $aDate = $a['release_date'] ?? $a['first_air_date'] ?? '';
            $bDate = $b['release_date'] ?? $b['first_air_date'] ?? '';
            return strcmp($bDate, $aDate);
        });

        $json['credits'] = $filteredCredits;

        return response()->json($json, 200);
    }
}
