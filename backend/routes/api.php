<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TmdbController;

Route::get('/tmdb/popular', [TmdbController::class, 'popular']);
Route::get('/tmdb/search', [TmdbController::class, 'search']);