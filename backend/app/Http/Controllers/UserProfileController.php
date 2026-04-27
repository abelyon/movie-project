<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserProfileController extends Controller
{
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'min:3',
                'max:255',
            ],
        ]);

        $user = $request->user();
        $user->name = trim((string) $validated['name']);
        $user->save();

        return response()->json(['user' => $user->fresh()]);
    }
}

