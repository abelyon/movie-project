<?php

namespace App\Providers;

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
        $this->app->instance(LoginResponseContract::class, new class implements LoginResponseContract
        {
            public function toResponse($request)
            {
                return $request->wantsJson()
                    ? response()->json(['user' => $request->user()], 200)
                    : redirect()->intended(config('fortify.home'));
            }
        });

        $this->app->instance(RegisterResponseContract::class, new class implements RegisterResponseContract
        {
            public function toResponse($request)
            {
                return $request->wantsJson()
                    ? response()->json(['user' => $request->user()], 201)
                    : redirect()->intended(config('fortify.home'));
            }
        });
    }
}
