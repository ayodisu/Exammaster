<?php

namespace App\Http\Controllers;

use App\Models\Attempt;
use App\Models\Exam;
use App\Models\Question;
use App\Models\Response;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class ExamController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if ($user instanceof \App\Models\Examiner) {
            $exams = Exam::where('examiner_id', $user->id)->with('attempts')->get();
            return $exams->map(function ($exam) {
                // Filter only submitted attempts for stats
                $attempts = $exam->attempts->where('status', 'submitted');
                $count = $attempts->count();
                $avg = $count > 0 ? $attempts->avg('score') : 0;
                $pass = $attempts->where('score', '>=', 50)->count();
                $rate = $count > 0 ? ($pass / $count) * 100 : 0;

                $exam->stats = [
                    'attempts' => $count,
                    'avg_score' => round($avg, 1),
                    'pass_rate' => round($rate, 1)
                ];
                unset($exam->attempts);
                return $exam;
            });
        }
        return Exam::where('is_published', true)->get();
    }

    public function store(Request $request)
    {
        if (! $request->user() instanceof \App\Models\Examiner) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            'title' => 'required|string',
            'duration_minutes' => 'required|integer',
            'settings_json' => 'nullable|array',
        ]);

        $exam = $request->user()->exams()->create($validated);

        return response()->json($exam, 201);
    }

    public function show($id)
    {
        return Exam::with('questions')->findOrFail($id);
    }

    public function start(Request $request, $id)
    {
        $exam = Exam::findOrFail($id);
        $user = $request->user();

        $attempt = Attempt::where('student_id', $user->id)
            ->where('exam_id', $exam->id)
            ->where('status', 'ongoing')
            ->first();

        if (!$attempt) {
            $attempt = Attempt::create([
                'student_id' => $user->id,
                'exam_id' => $exam->id,
                'started_at' => Carbon::now(),
                'status' => 'ongoing',
            ]);
        }

        return response()->json($attempt->load('exam.questions'));
    }

    public function saveAnswer(Request $request, $attemptId)
    {
        $attempt = Attempt::where('student_id', $request->user()->id)->findOrFail($attemptId);

        if ($attempt->status !== 'ongoing') {
            return response()->json(['message' => 'Exam is not ongoing'], 400);
        }

        $validated = $request->validate([
            'question_id' => 'required|exists:questions,id',
            'student_answer' => 'required',
            'time_spent_seconds' => 'nullable|integer'
        ]);

        $question = Question::find($validated['question_id']);
        $isCorrect = false;
        if ($question->type === 'mcq' || $question->type === 'tf') {
            $isCorrect = $validated['student_answer'] == $question->correct_answer;
        }

        $response = Response::updateOrCreate(
            ['attempt_id' => $attempt->id, 'question_id' => $validated['question_id']],
            [
                'student_answer' => $validated['student_answer'],
                'is_correct' => $isCorrect,
                'time_spent_seconds' => $validated['time_spent_seconds'] ?? 0
            ]
        );

        return response()->json($response);
    }

    public function finish(Request $request, $attemptId)
    {
        $attempt = Attempt::where('student_id', $request->user()->id)->findOrFail($attemptId);

        // Calculate Score
        $responses = $attempt->responses;
        $correctCount = $responses->where('is_correct', true)->count();
        $totalQuestions = $attempt->exam->questions()->count();

        $score = $totalQuestions > 0 ? round(($correctCount / $totalQuestions) * 100) : 0;

        $attempt->update([
            'status' => 'submitted',
            'submitted_at' => Carbon::now(),
            'score' => $score
        ]);

        return response()->json([
            'message' => 'Exam submitted successfully',
            'score' => $score
        ]);
    }

    public function userAttempts(Request $request)
    {
        return Attempt::with('exam')
            ->where('student_id', $request->user()->id)
            ->where('status', 'submitted') // Only return completed ones for results? Or all? User said "Pending exams" logic uses length.
            // Dashboard says: "Pending Exams": Math.max(0, exams.length - results.length)
            // So if I return ALL attempts, I should filter.
            // But "Your Performance" lists results.
            // I'll return all attempts, let frontend filter if needed.
            // Actually, usually "Results" implies submitted.
            ->get();
    }
}
