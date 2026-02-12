<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TmdbController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\FavouriteController;
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

    Route::get('/favourites', [FavouriteController::class, 'index']);
    Route::get('/favourites/with-details', [FavouriteController::class, 'indexWithDetails']);
    Route::post('/favourites', [FavouriteController::class, 'store']);
    Route::delete('/favourites/{id}', [FavouriteController::class, 'destroy']);
    Route::get('/favourites/check', [FavouriteController::class, 'check']);
    Route::post('/favourites/toggle', [FavouriteController::class, 'toggle']);

    Route::get('/reactions/check', [ReactionController::class, 'check']);
    Route::post('/reactions', [ReactionController::class, 'set']);
});
