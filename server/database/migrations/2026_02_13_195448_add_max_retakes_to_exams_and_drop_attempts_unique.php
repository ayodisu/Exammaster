<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exams', function (Blueprint $table) {
            $table->unsignedInteger('max_retakes')->default(0)->after('is_active');
        });

        Schema::table('attempts', function (Blueprint $table) {
            $table->dropForeign(['student_id']);
            $table->dropForeign(['exam_id']);
        });

        Schema::table('attempts', function (Blueprint $table) {
            $table->dropUnique(['student_id', 'exam_id']);
        });

        Schema::table('attempts', function (Blueprint $table) {
            $table->foreign('student_id')->references('id')->on('candidates')->cascadeOnDelete();
            $table->foreign('exam_id')->references('id')->on('exams');
        });
    }

    public function down(): void
    {
        Schema::table('exams', function (Blueprint $table) {
            $table->dropColumn('max_retakes');
        });

        Schema::table('attempts', function (Blueprint $table) {
            $table->unique(['student_id', 'exam_id']);
        });
    }
};
