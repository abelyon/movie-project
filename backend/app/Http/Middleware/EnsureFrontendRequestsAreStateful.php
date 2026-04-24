<?php

namespace App\Http\Middleware;

use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful as SanctumEnsureFrontendRequestsAreStateful;

/**
 * Keep session cookie attributes from config/session.php for SPA auth.
 * This mirrors the colorcoder setup and allows SameSite=None in cross-origin deployments.
 */
class EnsureFrontendRequestsAreStateful extends SanctumEnsureFrontendRequestsAreStateful
{
    protected function configureSecureCookieSessions(): void
    {
        // Intentionally empty: respect SESSION_SAME_SITE / SESSION_SECURE_COOKIE.
    }
}

