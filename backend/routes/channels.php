<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::routes([
    'prefix' => 'api',
    'middleware' => ['api', 'auth:sanctum'],
]);

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
