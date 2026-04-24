<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;

/**
 * Railway split-origin fallback:
 * Fortify auth endpoints are handled as API-style requests and can fail CSRF
 * token validation when frontend/backend are on unrelated hosts.
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
        'api/user/media/save',
        'api/user/media/like',
        'api/user/media/dislike',
        'api/user/media/favorite',
        'api/user/media/watched',
    ];
}

