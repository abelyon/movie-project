<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('index');
});

Route::get('/discovery', function () {
    return view('discovery');
});

Route::get('/favourite', function () {
    return view('favourite');
});

Route::get('/profile', function () {
    return view('profile');
});