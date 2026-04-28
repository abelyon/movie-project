<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Fortify's default verification flow may redirect to /home?verified=1.
// In SPA deployments, forward that state to the frontend profile route.
Route::get('/home', function (Request $request) {
    $frontendUrl = rtrim((string) env('FRONTEND_URL', ''), '/');
    if ($frontendUrl !== '') {
        return redirect()->away($frontendUrl.'/profile?email_verified=1');
    }

    return response()->json([
        'verified' => (bool) $request->query('verified'),
    ]);
});
