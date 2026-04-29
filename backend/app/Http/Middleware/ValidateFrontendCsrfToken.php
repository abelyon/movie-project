<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;

/**
 * Railway split-origin fallback:
 * Fortify auth endpoints are handled as API-style requests and can fail CSRF
 * token validation when frontend/backend are on unrelated hosts.
 *
 * Friend mutations follow the same split-origin pattern as user media actions.
 */
class ValidateFrontendCsrfToken extends ValidateCsrfToken
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array<int, string>
     */
    protected $except = [
        'login',
        'register',
        'logout',
        'broadcasting/auth',
        'broadcasting/*',
        'api/broadcasting/auth',
        'api/broadcasting/*',
        'forgot-password',
        'reset-password',
        'email/verification-notification',
        'api/email/verification-notification',
        'api/user/media/save',
        'api/user/media/like',
        'api/user/media/dislike',
        'api/user/media/favorite',
        'api/user/media/watched',
        'api/friends/*',
    ];
}

