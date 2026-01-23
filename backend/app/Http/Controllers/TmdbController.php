<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class TmdbController extends Controller
{
    public function popular(Request $request)
    {
        $page = $request->query('page', 1);
    
        $movies = Http::get('https://api.themoviedb.org/3/movie/popular', [
            'api_key' => env('TMDB_API_KEY'),
            'page' => $page,
        ])->json()['results'] ?? [];
    
        $shows = Http::get('https://api.themoviedb.org/3/tv/popular', [
            'api_key' => env('TMDB_API_KEY'),
            'page' => $page,
        ])->json()['results'] ?? [];
    
        $mixed = array_merge(
            array_map(fn($m) => $m + ['media_type' => 'movie'], $movies),
            array_map(fn($s) => $s + ['media_type' => 'show'], $shows),
        );
    
        usort($mixed, fn($a, $b) => ($b['popularity'] ?? 0) <=> ($a['popularity'] ?? 0));
    
        return response()->json(['results' => $mixed]);
    }

    public function search(Request $request)
    {
        $query = trim($request->query('query', ''));
        $page = $request->query('page', 1);

        if ($query === '') {
            return response()->json(['results' => []]);
        }

        $results = Http::get('https://api.themoviedb.org/3/search/multi', [
            'api_key' => env('TMDB_API_KEY'),
            'query' => $query,
            'page' => $page,
        ])->json()['results'] ?? [];

        $filtered = array_values(array_filter($results, function ($item) {
            $type = $item['media_type'] ?? '';
            return $type === 'movie' || $type === 'tv';
        }));

        $normalized = array_map(function ($item) {
            if (($item['media_type'] ?? '') === 'tv') {
                $item['media_type'] = 'show';
            }
            return $item;
        }, $filtered);

        return response()->json(['results' => $normalized]);
    }
}