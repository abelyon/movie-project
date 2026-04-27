<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use App\Http\Controllers\FriendController;
use App\Http\Controllers\TmdbController;
use App\Http\Controllers\MediaController;
use App\Http\Controllers\UserProfileController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
Route::patch('/user/profile', [UserProfileController::class, 'update'])->middleware('auth:sanctum');
Route::get('/email/verification-status', function (Request $request) {
    return response()->json([
        'verified' => (bool) $request->user()?->hasVerifiedEmail(),
    ]);
})->middleware('auth:sanctum');
Route::post('/email/verification-notification', function (Request $request) {
    if ($request->user()?->hasVerifiedEmail()) {
        return response()->json(['sent' => false, 'already_verified' => true]);
    }

    $request->user()->sendEmailVerificationNotification();
    return response()->json(['sent' => true]);
})->middleware(['auth:sanctum', 'throttle:6,1']);
Route::get('/email/verify/{id}/{hash}', function (EmailVerificationRequest $request) {
    if (!$request->user()->hasVerifiedEmail()) {
        $request->fulfill();
    }

    $frontendUrl = rtrim((string) env('FRONTEND_URL', ''), '/');
    if ($frontendUrl !== '') {
        return redirect()->away($frontendUrl.'/profile?email_verified=1');
    }

    return response()->json(['verified' => true]);
})->middleware(['auth:sanctum', 'signed', 'throttle:6,1'])->name('verification.verify.spa');

Route::middleware('auth:sanctum')->prefix('user/media')->group(function () {
    Route::get('/', [MediaController::class, 'index']);
    Route::get('/state', [MediaController::class, 'state']);
    Route::get('/saved', [MediaController::class, 'saved']);
    Route::get('/liked', [MediaController::class, 'liked']);
    Route::get('/favorited', [MediaController::class, 'favorited']);
    Route::post('/save', [MediaController::class, 'save']);
    Route::delete('/save', [MediaController::class, 'unsave']);
    Route::post('/like', [MediaController::class, 'like']);
    Route::delete('/like', [MediaController::class, 'unlike']);
    Route::post('/dislike', [MediaController::class, 'dislike']);
    Route::delete('/dislike', [MediaController::class, 'undislike']);
    Route::post('/favorite', [MediaController::class, 'favorite']);
    Route::delete('/favorite', [MediaController::class, 'unfavorite']);
    Route::post('/watched', [MediaController::class, 'watched']);
    Route::delete('/watched', [MediaController::class, 'unwatched']);
});

Route::middleware('auth:sanctum')->prefix('friends')->group(function () {
    Route::get('/', [FriendController::class, 'index']);
    Route::get('/search', [FriendController::class, 'search']);
    Route::delete('/{friend}', [FriendController::class, 'remove']);
    Route::post('/requests', [FriendController::class, 'send']);
    Route::post('/requests/{friendRequest}/accept', [FriendController::class, 'accept']);
    Route::post('/requests/{friendRequest}/deny', [FriendController::class, 'deny']);
});

Route::get('/trending', [TmdbController::class, 'trending']);
Route::get('/discover/{type}', [TmdbController::class, 'discover']);
Route::get('/search', [TmdbController::class, 'search']);
Route::get('/movie/{id}', [TmdbController::class, 'movie']);
Route::get('/tv/{id}', [TmdbController::class, 'tv']);
