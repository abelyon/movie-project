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
        if (! Schema::hasTable('users')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'two_factor_secret')) {
                $secret = $table->text('two_factor_secret')->nullable();

                if (Schema::hasColumn('users', 'password')) {
                    $secret->after('password');
                }
            }

            if (! Schema::hasColumn('users', 'two_factor_recovery_codes')) {
                $recovery = $table->text('two_factor_recovery_codes')->nullable();

                if (Schema::hasColumn('users', 'two_factor_secret')) {
                    $recovery->after('two_factor_secret');
                } elseif (Schema::hasColumn('users', 'password')) {
                    $recovery->after('password');
                }
            }

            if (! Schema::hasColumn('users', 'two_factor_confirmed_at')) {
                $confirmed = $table->timestamp('two_factor_confirmed_at')->nullable();

                if (Schema::hasColumn('users', 'two_factor_recovery_codes')) {
                    $confirmed->after('two_factor_recovery_codes');
                } elseif (Schema::hasColumn('users', 'two_factor_secret')) {
                    $confirmed->after('two_factor_secret');
                } elseif (Schema::hasColumn('users', 'password')) {
                    $confirmed->after('password');
                }
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('users')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $columns = [];

            if (Schema::hasColumn('users', 'two_factor_secret')) {
                $columns[] = 'two_factor_secret';
            }

            if (Schema::hasColumn('users', 'two_factor_recovery_codes')) {
                $columns[] = 'two_factor_recovery_codes';
            }

            if (Schema::hasColumn('users', 'two_factor_confirmed_at')) {
                $columns[] = 'two_factor_confirmed_at';
            }

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
