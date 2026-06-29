<?php

namespace App\Http\Controllers;

use App\Support\ProfileColors;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

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
            'country_code' => ['sometimes', 'nullable', 'string', 'size:2', 'regex:/^[A-Za-z]{2}$/'],
            'profile_color' => ['sometimes', 'nullable', 'string', Rule::in(ProfileColors::ALL)],
        ]);

        $user = $request->user();
        $user->name = trim((string) $validated['name']);
        if (array_key_exists('country_code', $validated)) {
            $country = strtoupper((string) ($validated['country_code'] ?? ''));
            $user->country_code = $country !== '' ? $country : null;
        }
        if (array_key_exists('profile_color', $validated)) {
            $user->profile_color = $validated['profile_color'] ?? ProfileColors::DEFAULT;
        }
        $user->save();

        return response()->json(['user' => $user->fresh()]);
    }
}

