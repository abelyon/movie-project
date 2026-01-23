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
        Schema::create('newusers', function (Blueprint $table) {
            $table->id();
            $table->string("username");
            $table->string("email");
            $table->string("password");
            $table->double("ratings");
            $table->boolean("seen_it");
            $table->string("favourite_genres");
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('newuser_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('newuser_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('newusers');
        Schema::dropIfExists('sessions');
    }
};
