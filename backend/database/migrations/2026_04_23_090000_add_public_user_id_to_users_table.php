<?php

use App\Models\User;
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
            if (!Schema::hasColumn('users', 'public_user_id')) {
                $table->string('public_user_id', 16)->nullable()->unique()->after('id');
            }
        });

        User::query()
            ->whereNull('public_user_id')
            ->select(['id'])
            ->chunkById(200, function ($users): void {
                foreach ($users as $user) {
                    User::query()
                        ->where('id', $user->id)
                        ->update(['public_user_id' => User::generatePublicUserId()]);
                }
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'public_user_id')) {
                $table->dropUnique(['public_user_id']);
                $table->dropColumn('public_user_id');
            }
        });
    }
};
