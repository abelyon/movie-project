<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\ServiceProvider;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Laravel\Fortify\Contracts\RegisterResponse as RegisterResponseContract;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        ResetPassword::createUrlUsing(function (object $notifiable, string $token): string {
            $frontendUrl = rtrim((string) env('FRONTEND_URL', ''), '/');
            if ($frontendUrl === '') {
                return url('/reset-password?token=' . urlencode($token) . '&email=' . urlencode((string) $notifiable->getEmailForPasswordReset()));
            }

            return $frontendUrl . '/reset-password?token=' . urlencode($token) . '&email=' . urlencode((string) $notifiable->getEmailForPasswordReset());
        });

        $this->app->instance(LoginResponseContract::class, new class implements LoginResponseContract
        {
            public function toResponse($request)
            {
                return response()->json(['user' => $request->user()], 200);
            }
        });

        $this->app->instance(RegisterResponseContract::class, new class implements RegisterResponseContract
        {
            public function toResponse($request)
            {
                return response()->json(['user' => $request->user()], 201);
            }
        });
    }
}
