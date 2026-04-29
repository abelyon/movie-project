<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class LogBroadcastAuthContext
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->is('broadcasting/auth')) {
            Log::info('broadcast-auth context (before)', [
                'path' => $request->path(),
                'method' => $request->method(),
                'origin' => $request->headers->get('origin'),
                'referer' => $request->headers->get('referer'),
                'has_session_cookie' => $request->cookies->has(config('session.cookie')),
                'has_xsrf_cookie' => $request->cookies->has('XSRF-TOKEN'),
                'has_x_xsrf_token' => $request->headers->has('x-xsrf-token'),
                'expects_json' => $request->expectsJson(),
                'user_id_default_guard' => optional($request->user())->id,
                'user_id_web_guard' => optional($request->user('web'))->id,
            ]);
        }

        $response = $next($request);

        if ($request->is('broadcasting/auth')) {
            Log::info('broadcast-auth context (after)', [
                'status' => $response->getStatusCode(),
                'user_id_default_guard' => optional($request->user())->id,
                'user_id_web_guard' => optional($request->user('web'))->id,
            ]);
        }

        return $response;
    }
}
