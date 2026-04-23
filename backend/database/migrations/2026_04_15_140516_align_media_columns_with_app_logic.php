<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('media')) {
            return;
        }

        // Rename legacy columns if present.
        if (Schema::hasColumn('media', 'saved') && !Schema::hasColumn('media', 'is_saved')) {
            // MariaDB/MySQL versions without `RENAME COLUMN` still support CHANGE.
            DB::statement('ALTER TABLE media CHANGE saved is_saved BOOLEAN NOT NULL DEFAULT 0');
        }

        if (Schema::hasColumn('media', 'liked') && !Schema::hasColumn('media', 'is_liked')) {
            DB::statement('ALTER TABLE media CHANGE liked is_liked BOOLEAN NULL');
        }

        // Add missing columns used by the current model/controller.
        Schema::table('media', function (Blueprint $table) {
            if (!Schema::hasColumn('media', 'is_saved')) {
                $table->boolean('is_saved')->default(false)->after('type');
            }

            if (!Schema::hasColumn('media', 'is_liked')) {
                $table->boolean('is_liked')->default(false)->after('is_saved');
            }

            if (!Schema::hasColumn('media', 'is_disliked')) {
                $table->boolean('is_disliked')->default(false)->after('is_liked');
            }

            if (!Schema::hasColumn('media', 'watched_at')) {
                $table->timestamp('watched_at')->nullable()->after('is_disliked');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('media')) {
            return;
        }

        Schema::table('media', function (Blueprint $table) {
            if (Schema::hasColumn('media', 'watched_at')) {
                $table->dropColumn('watched_at');
            }

            if (Schema::hasColumn('media', 'is_disliked')) {
                $table->dropColumn('is_disliked');
            }
        });

        if (Schema::hasColumn('media', 'is_saved') && !Schema::hasColumn('media', 'saved')) {
            DB::statement('ALTER TABLE media CHANGE is_saved saved BOOLEAN NOT NULL DEFAULT 0');
        }

        if (Schema::hasColumn('media', 'is_liked') && !Schema::hasColumn('media', 'liked')) {
            DB::statement('ALTER TABLE media CHANGE is_liked liked BOOLEAN NULL');
        }
    }
};
