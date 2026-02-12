<?php

namespace App\Http\Controllers;

use App\Models\Reaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReactionController extends Controller
{
    public function set(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'media_type' => ['required', 'string', 'in:movie,tv'],
            'tmdb_id' => ['required', 'integer', 'min:1'],
            'reaction' => ['required', 'string', 'in:like,dislike'],
        ]);

        $reaction = $request->user()->reactions()
            ->where('media_type', $validated['media_type'])
            ->where('tmdb_id', $validated['tmdb_id'])
            ->first();

        if ($reaction && $reaction->reaction === $validated['reaction']) {
            $reaction->delete();
            return response()->json(['reaction' => null, 'message' => 'Reaction removed.']);
        }

        $reaction = $request->user()->reactions()->updateOrCreate(
            [
                'media_type' => $validated['media_type'],
                'tmdb_id' => $validated['tmdb_id'],
            ],
            ['reaction' => $validated['reaction']]
        );

        return response()->json(['reaction' => $reaction->reaction]);
    }

    public function check(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'media_type' => ['required', 'string', 'in:movie,tv'],
            'tmdb_id' => ['required', 'integer', 'min:1'],
        ]);

        $reaction = $request->user()->reactions()
            ->where('media_type', $validated['media_type'])
            ->where('tmdb_id', $validated['tmdb_id'])
            ->first();

        return response()->json(['reaction' => $reaction?->reaction]);
    }
}
