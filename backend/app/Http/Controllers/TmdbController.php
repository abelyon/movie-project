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

        $response = Http::get("{$url}/discover/{$type}", $queryParams);

        if ($response->failed()) {
            return response()->json([
                'message' => 'Failed to fetch data from TMDB',
            ], $response->status());
        }

        return response()->json($response->json(), 200);
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

    public function movie($id) {
        $apiKey = config('services.tmdb.api_key');
        $url = config('services.tmdb.url');

        $response = Http::get("{$url}/movie/{$id}", [
            'api_key' => $apiKey,
            'append_to_response' => 'credits,watch/providers',
        ]);
        $json = $response->json();
        $watchProviders = $json['watch/providers']['results']['US'] ?? null;
        unset($json['watch/providers']);
        $json['watch_providers'] = $watchProviders;
        $json['cast'] = $json['credits']['cast'] ?? [];
        unset($json['credits']);

        return response()->json($json, 200);
    }

    public function tv($id) {
        $apiKey = config('services.tmdb.api_key');
        $url = config('services.tmdb.url');

        $response = Http::get("{$url}/tv/{$id}", [
            'api_key' => $apiKey,
            'append_to_response' => 'credits,watch/providers',
        ]);
        $json = $response->json();
        $watchProviders = $json['watch/providers']['results']['US'] ?? null;
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
