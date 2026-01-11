<?php

namespace App\Console\Commands;

use App\Models\Attempt;
use App\Models\Response;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class AutoSubmitExpiredExams extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'exams:auto-submit';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Auto-submit ongoing exam attempts that have exceeded their time limit';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking for expired ongoing attempts...');

        // Find all ongoing attempts with their exam data
        $ongoingAttempts = Attempt::where('status', 'ongoing')
            ->with('exam')
            ->get();

        $submittedCount = 0;

        foreach ($ongoingAttempts as $attempt) {
            if (!$attempt->exam) {
                continue;
            }

            // Calculate when the attempt should have ended
            $startedAt = Carbon::parse($attempt->started_at);
            $duration = $attempt->exam->duration_minutes;
            $shouldEndAt = $startedAt->addMinutes($duration);

            // Check if the time has expired (with 1 minute buffer)
            if (Carbon::now()->greaterThan($shouldEndAt->addMinute())) {
                // Calculate score
                $score = $this->calculateScore($attempt);

                // Update the attempt
                $attempt->update([
                    'status' => 'submitted',
                    'submitted_at' => Carbon::now(),
                    'score' => $score
                ]);

                $this->line("  - Auto-submitted attempt #{$attempt->id} for student #{$attempt->student_id} with score: {$score}%");
                $submittedCount++;
            }
        }

        if ($submittedCount > 0) {
            $this->info("Auto-submitted {$submittedCount} expired attempt(s).");
        } else {
            $this->info('No expired attempts found.');
        }

        return Command::SUCCESS;
    }

    /**
     * Calculate the score for an attempt based on recorded responses.
     */
    private function calculateScore(Attempt $attempt): int
    {
        $exam = $attempt->exam;
        if (!$exam) {
            return 0;
        }

        $questions = $exam->questions;
        if ($questions->isEmpty()) {
            return 0;
        }

        $responses = Response::where('attempt_id', $attempt->id)->get()->keyBy('question_id');
        $correct = 0;

        foreach ($questions as $question) {
            $response = $responses->get($question->id);
            if ($response && $response->student_answer === $question->correct_answer) {
                $correct++;
            }
        }

        return (int) round(($correct / $questions->count()) * 100);
    }
}
