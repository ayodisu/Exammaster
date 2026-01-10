<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Exam;
use App\Models\Topic;
use App\Models\Question;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Examiners
        $examiner = \App\Models\Examiner::create([
            'name' => 'Demo Examiner',
            'email' => 'examiner@demo.com',
            'password' => Hash::make('password'),
            'is_admin' => true,
        ]);

        // 2. Create Candidate
        $candidate = \App\Models\Candidate::create([
            'first_name' => 'Demo',
            'last_name' => 'Student',
            'email' => 'student@demo.com',
            'password' => Hash::make('password'),
            'exam_number' => 'EXM' . date('Y') . '001',
            'status' => 'active',
            'gender' => 'male',
            'address' => 'Demo Address'
        ]);

        // 2. Create Topic
        $mathTopic = Topic::create([
            'name' => 'Mathematics',
            'slug' => 'math',
            'description' => 'Algebra and Geometry basics'
        ]);

        // 3. Create Exam
        $exam = Exam::create([
            'examiner_id' => $examiner->id,
            'title' => 'Math Midterm 2024',
            'duration_minutes' => 30,
            'is_published' => true,
            'settings_json' => ['shuffle_questions' => true]
        ]);

        // 4. Create Questions
        Question::create([
            'topic_id' => $mathTopic->id,
            'exam_id' => $exam->id,
            'text' => 'What is 2 + 2?',
            'type' => 'mcq',
            'difficulty' => 'easy',
            'options_json' => [
                ['id' => 1, 'text' => '3'],
                ['id' => 2, 'text' => '4'],
                ['id' => 3, 'text' => '5'],
                ['id' => 4, 'text' => '22'],
            ],
            'correct_answer' => '2', // Option ID
            'explanation' => 'Basic addition.'
        ]);

        Question::create([
            'topic_id' => $mathTopic->id,
            'exam_id' => $exam->id,
            'text' => 'The earth is flat.',
            'type' => 'tf',
            'difficulty' => 'easy',
            'options_json' => [
                ['id' => 1, 'text' => 'True'],
                ['id' => 2, 'text' => 'False'],
            ],
            'correct_answer' => '2', // Option ID for False
            'explanation' => 'Scientific consensus.'
        ]);
    }
}
