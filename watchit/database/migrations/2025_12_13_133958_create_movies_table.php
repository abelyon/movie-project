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
        Schema::create('movies', function (Blueprint $table) {
            $table->id();
            $table->string('title', 200);
            $table->string('description', 1000)->nullable();
            $table->date('release_date')->nullable();
            $table->string('runtime', 20)->nullable();

            $table->foreignId('director_id')->nullable()->constrained('cast_crews')->nullOnDelete();
            $table->foreignId('writers_id')->nullable()->constrained('cast_crews')->nullOnDelete();
            $table->foreignId('actors_id')->nullable()->constrained('cast_crews')->nullOnDelete();

            $table->decimal('rating', 3, 1)->nullable();
            $table->decimal('user_rating', 3, 1)->nullable();

            $table->foreignId('user_seen_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('genre_id')->nullable()->constrained('genres')->nullOnDelete();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('movies');
    }
};
