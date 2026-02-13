<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('examiners', function (Blueprint $table) {
            $table->string('status')->default('active')->after('is_admin');
        });
    }

    public function down(): void
    {
        Schema::table('examiners', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};
