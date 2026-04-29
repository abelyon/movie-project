<?php

use App\Http\Middleware\EnsureFrontendRequestsAreStateful;
use App\Http\Middleware\LogBroadcastAuthContext;
use Illuminate\Support\Facades\Broadcast;

Broadcast::routes(['middleware' => ['web', EnsureFrontendRequestsAreStateful::class, LogBroadcastAuthContext::class, 'auth:sanctum']]);

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    if (!$user) {
        return false;
    }

    return (int) $user->id === (int) $id;
});

Broadcast::channel('users.{id}', function ($user, $id) {
    if (!$user) {
        return false;
    }

    return (int) $user->id === (int) $id;
});
