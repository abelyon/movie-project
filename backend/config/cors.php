<?php

$frontend = env('FRONTEND_URL');
if (is_string($frontend)) {
    $frontend = trim($frontend, " \t\n\r\0\x0B\"'");
}
$allowedOrigins = array_values(array_unique(array_filter([
    $frontend ? rtrim($frontend, '/') : null,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
])));

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    | FRONTEND_URL must match your SPA origin (e.g. https://your-app.up.railway.app).
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie', 'login', 'register', 'logout'],

    'allowed_methods' => ['*'],

    'allowed_origins' => $allowedOrigins,

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
