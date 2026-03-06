<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TmdbController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\SavedController;
use App\Http\Controllers\ReactionController;

Route::get('/tmdb/popular', [TmdbController::class, 'popular']);
Route::get('/tmdb/search', [TmdbController::class, 'search']);
Route::get('/tmdb/genres', [TmdbController::class, 'genres']);
Route::get('/tmdb/discover', [TmdbController::class, 'discover']);
Route::get('/tmdb/{type}/{id}', [TmdbController::class, 'detail']);

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth.token')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    Route::get('/saved', [SavedController::class, 'index']);
    Route::get('/saved/with-details', [SavedController::class, 'indexWithDetails']);
    Route::post('/saved', [SavedController::class, 'store']);
    Route::delete('/saved/{id}', [SavedController::class, 'destroy']);
    Route::get('/saved/check', [SavedController::class, 'check']);
    Route::post('/saved/toggle', [SavedController::class, 'toggle']);

    Route::get('/reactions/check', [ReactionController::class, 'check']);
    Route::post('/reactions', [ReactionController::class, 'set']);
});
