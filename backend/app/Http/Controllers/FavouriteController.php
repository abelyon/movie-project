<?php

namespace App\Http\Controllers;

use App\Models\Favourite;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FavouriteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $favourites = $request->user()->favourites()->get();

        return response()->json(['favourites' => $favourites]);
    }

    /**
     * Return favourites with TMDB details embedded (one request instead of 1 + N).
     */
    public function indexWithDetails(Request $request): JsonResponse
    {
        $favourites = $request->user()->favourites()->get();

        if ($favourites->isEmpty()) {
            return response()->json(['favourites' => [], 'details' => []]);
        }

        $tmdb = app(TmdbController::class);
        $items = $favourites->map(fn (Favourite $f) => [
            'media_type' => $f->media_type,
            'tmdb_id' => $f->tmdb_id,
        ])->all();
        $details = $tmdb->fetchDetailsBatch($items);

        $withDetails = $favourites->map(function (Favourite $f) use ($details) {
            $key = $f->media_type . '-' . $f->tmdb_id;
            $detail = $details[$key] ?? null;
            return [
                'id' => $f->id,
                'media_type' => $f->media_type,
                'tmdb_id' => $f->tmdb_id,
                'detail' => $detail,
            ];
        })->values();

        return response()->json(['favourites' => $withDetails]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'media_type' => ['required', 'string', 'in:movie,tv'],
            'tmdb_id' => ['required', 'integer', 'min:1'],
        ]);

        $favourite = $request->user()->favourites()->updateOrCreate(
            [
                'media_type' => $validated['media_type'],
                'tmdb_id' => $validated['tmdb_id'],
            ],
            $validated
        );

        return response()->json(['favourite' => $favourite], 201);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $favourite = $request->user()->favourites()->findOrFail($id);
        $favourite->delete();

        return response()->json(['message' => 'Removed from favourites.']);
    }

    public function check(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'media_type' => ['required', 'string', 'in:movie,tv'],
            'tmdb_id' => ['required', 'integer', 'min:1'],
        ]);

        $exists = $request->user()->favourites()
            ->where('media_type', $validated['media_type'])
            ->where('tmdb_id', $validated['tmdb_id'])
            ->exists();

        return response()->json(['is_favourite' => $exists]);
    }

    public function toggle(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'media_type' => ['required', 'string', 'in:movie,tv'],
            'tmdb_id' => ['required', 'integer', 'min:1'],
        ]);

        $favourite = $request->user()->favourites()
            ->where('media_type', $validated['media_type'])
            ->where('tmdb_id', $validated['tmdb_id'])
            ->first();

        if ($favourite) {
            $favourite->delete();
            return response()->json(['is_favourite' => false, 'message' => 'Removed from favourites.']);
        }

        $favourite = $request->user()->favourites()->create($validated);
        return response()->json(['is_favourite' => true, 'favourite' => $favourite], 201);
    }
}
