<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('favourites') && !Schema::hasTable('saved')) {
            Schema::rename('favourites', 'saved');
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('saved') && !Schema::hasTable('favourites')) {
            Schema::rename('saved', 'favourites');
        }
    }
};
