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
        // 1. Deduplicate existing attempts
        $duplicates = DB::table('attempts')
            ->select('student_id', 'exam_id')
            ->selectRaw('count(*) as count')
            ->groupBy('student_id', 'exam_id')
            ->having('count', '>', 1)
            ->get();

        foreach ($duplicates as $dup) {
            // Get all attempts for this student & exam
            $attempts = DB::table('attempts')
                ->where('student_id', $dup->student_id)
                ->where('exam_id', $dup->exam_id)
                ->orderByRaw("CASE WHEN status = 'submitted' THEN 1 ELSE 2 END") // Prefer submitted
                ->orderBy('score', 'desc') // Then higher score
                ->orderBy('updated_at', 'desc') // Then latest update
                ->get();
            
            // The first one is the one we keep
            $keep = $attempts->first();
            
            // Delete the rest
            foreach ($attempts as $attempt) {
                if ($attempt->id !== $keep->id) {
                    // Delete related responses first
                    DB::table('responses')->where('attempt_id', $attempt->id)->delete();
                    DB::table('attempts')->where('id', $attempt->id)->delete();
                }
            }
        }

        // 2. Add Unique Constraint
        Schema::table('attempts', function (Blueprint $table) {
            $table->unique(['student_id', 'exam_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attempts', function (Blueprint $table) {
            $table->dropUnique(['student_id', 'exam_id']);
        });
    }
};
