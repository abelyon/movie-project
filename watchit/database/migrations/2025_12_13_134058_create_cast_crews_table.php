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
        Schema::create('cast_crews', function (Blueprint $table) {
            $table->id();
            $table->string('director', 100)->nullable();
            $table->string('writers', 100)->nullable();
            $table->string('actors', 100)->nullable();
            $table->foreignId('movie_id')->constrained('movies')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cast_crews');
    }
};
