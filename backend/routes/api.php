<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TmdbController;
use App\Http\Controllers\MediaController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::middleware('auth:sanctum')->prefix('user/media')->group(function () {
    Route::get('/', [MediaController::class, 'index']);
    Route::get('/state', [MediaController::class, 'state']);
    Route::get('/saved', [MediaController::class, 'saved']);
    Route::get('/liked', [MediaController::class, 'liked']);
    Route::post('/save', [MediaController::class, 'save']);
    Route::delete('/save', [MediaController::class, 'unsave']);
    Route::post('/like', [MediaController::class, 'like']);
    Route::delete('/like', [MediaController::class, 'unlike']);
    Route::post('/dislike', [MediaController::class, 'dislike']);
    Route::delete('/dislike', [MediaController::class, 'undislike']);
    Route::post('/watched', [MediaController::class, 'watched']);
});

Route::get('/trending', [TmdbController::class, 'trending']);
Route::get('/discover/{type}', [TmdbController::class, 'discover']);
Route::get('/search', [TmdbController::class, 'search']);
Route::get('/movie/{id}', [TmdbController::class, 'movie']);
Route::get('/tv/{id}', [TmdbController::class, 'tv']);
