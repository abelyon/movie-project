<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->decimal('rating', 3, 1)->nullable();
            $table->string('movies_seen', 3)->nullable();
            $table->foreignId('fav_genre')->nullable()->constrained('genres')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['fav_genre']);
            $table->dropColumn(['rating', 'movies_seen', 'fav_genre']);
        });
    }
};
