<?php

namespace App\Http\Controllers;

use App\Models\Saved;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SavedController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $items = $request->user()->saved()->get();

        return response()->json(['saved' => $items]);
    }

    public function indexWithDetails(Request $request): JsonResponse
    {
        $items = $request->user()->saved()->get();

        if ($items->isEmpty()) {
            return response()->json(['saved' => [], 'details' => []]);
        }

        $tmdb = app(TmdbController::class);
        $payload = $items->map(fn (Saved $s) => [
            'media_type' => $s->media_type,
            'tmdb_id' => $s->tmdb_id,
        ])->all();
        $details = $tmdb->fetchDetailsBatch($payload);

        $withDetails = $items->map(function (Saved $s) use ($details) {
            $key = $s->media_type . '-' . $s->tmdb_id;
            $detail = $details[$key] ?? null;
            return [
                'id' => $s->id,
                'media_type' => $s->media_type,
                'tmdb_id' => $s->tmdb_id,
                'detail' => $detail,
            ];
        })->values();

        return response()->json(['saved' => $withDetails]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'media_type' => ['required', 'string', 'in:movie,tv'],
            'tmdb_id' => ['required', 'integer', 'min:1'],
        ]);

        $item = $request->user()->saved()->updateOrCreate(
            [
                'media_type' => $validated['media_type'],
                'tmdb_id' => $validated['tmdb_id'],
            ],
            $validated
        );

        return response()->json(['saved' => $item], 201);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $item = $request->user()->saved()->findOrFail($id);
        $item->delete();

        return response()->json(['message' => 'Removed from saved.']);
    }

    public function check(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'media_type' => ['required', 'string', 'in:movie,tv'],
            'tmdb_id' => ['required', 'integer', 'min:1'],
        ]);

        $exists = $request->user()->saved()
            ->where('media_type', $validated['media_type'])
            ->where('tmdb_id', $validated['tmdb_id'])
            ->exists();

        return response()->json(['is_saved' => $exists]);
    }

    public function toggle(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'media_type' => ['required', 'string', 'in:movie,tv'],
            'tmdb_id' => ['required', 'integer', 'min:1'],
        ]);

        $item = $request->user()->saved()
            ->where('media_type', $validated['media_type'])
            ->where('tmdb_id', $validated['tmdb_id'])
            ->first();

        if ($item) {
            $item->delete();
            return response()->json(['is_saved' => false, 'message' => 'Removed from saved.']);
        }

        $item = $request->user()->saved()->create($validated);
        return response()->json(['is_saved' => true, 'saved' => $item], 201);
    }
}
