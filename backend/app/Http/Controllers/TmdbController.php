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

        if ($type === 'movie') {
            $queryParams['primary_release_year'] = $request->query('year', 2026);
        } elseif ($type === 'tv') {
            $queryParams['first_air_date_year'] = $request->query('year', 2026);
        }

        $response = Http::get("{$url}/discover/{$type}", $queryParams);

        if ($response->failed()) {
            return response()->json([
                'message' => 'Failed to fetch data from TMDB',
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
}
