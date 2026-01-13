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

        // For students: return all published exams with availability status
        $exams = Exam::where('is_published', true)->get();
        return $exams->map(function ($exam) {
            // Exam is takeable if it's active
            $exam->can_take = $exam->is_active;

            // Calculate if exam is scheduled for future
            if ($exam->scheduled_at && !$exam->is_active) {
                $exam->is_scheduled = true;
                $exam->scheduled_time = $exam->scheduled_at;
            } else {
                $exam->is_scheduled = false;
            }

            return $exam;
        });
    }

    public function store(Request $request)
    {
        \Illuminate\Support\Facades\Log::info('Store Exam Request User Class: ' . get_class($request->user()));
        \Illuminate\Support\Facades\Log::info('User ID: ' . $request->user()->id);

        if (! $request->user() instanceof \App\Models\Examiner) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            'title' => 'required|string',
            'duration_minutes' => 'required|integer',
            'type' => 'required|in:exam,mock,test',
            'scheduled_at' => 'nullable|date',
            'settings_json' => 'nullable|array',
            'questions' => 'nullable|array',
            'questions.*.text' => 'required|string',
            'questions.*.type' => 'required|string',
            'questions.*.options' => 'required|array',
            'questions.*.correct_answer' => 'required|string',
        ]);

        $examData = collect($validated)->except('questions')->toArray();

        // If exam has a scheduled date, it should start as inactive
        // The scheduler will enable it at the scheduled time
        $hasSchedule = !empty($validated['scheduled_at']);

        $exam = $request->user()->exams()->create([
            ...$examData,
            'is_published' => true,
            'is_active' => !$hasSchedule // Active immediately only if no schedule
        ]);

        if (!empty($validated['questions'])) {
            foreach ($validated['questions'] as $qData) {
                $optionsFormatted = [];
                foreach ($qData['options'] as $idx => $optText) {
                    $optionsFormatted[] = ['id' => $optText, 'text' => $optText];
                }

                $exam->questions()->create([
                    'text' => $qData['text'],
                    'type' => $qData['type'],
                    'options_json' => $optionsFormatted,
                    'correct_answer' => $qData['correct_answer']
                ]);
            }
        }

        return response()->json($exam->load('questions'), 201);
    }

    public function show(Request $request, $id)
    {
        if ($request->user() instanceof \App\Models\Examiner) {
            return $request->user()->exams()->with('questions')->findOrFail($id);
        }
        // If candidate, check if active
        return Exam::where('is_active', true)->with('questions')->findOrFail($id);
    }

    public function stats(Request $request)
    {
        \Illuminate\Support\Facades\Log::info('Stats Request User Class: ' . ($request->user() ? get_class($request->user()) : 'null'));
        \Illuminate\Support\Facades\Log::info('Stats Request User ID: ' . ($request->user() ? $request->user()->id : 'null'));

        if (! $request->user() instanceof \App\Models\Examiner) {
            abort(403, 'Unauthorized');
        }

        $exams = $request->user()->exams()->withTrashed()->with('attempts')->get();

        $uniqueStudentIds = [];
        $totalDurations = 0;
        $attemptCountForDuration = 0;

        foreach ($exams as $exam) {
            $attempts = $exam->attempts->where('status', 'submitted');

            foreach ($attempts as $attempt) {
                $uniqueStudentIds[$attempt->student_id] = true;

                // Calculate duration based on submitted_at - started_at
                // Or simplified if we tracked time_spent in responses
                // For now, let's just use exam duration if full time used, or attempts diff
                $start = Carbon::parse($attempt->started_at);
                $end = Carbon::parse($attempt->submitted_at);
                $totalDurations += $end->diffInMinutes($start);
                $attemptCountForDuration++;
            }
        }

        $avgDuration = $attemptCountForDuration > 0 ? round($totalDurations / $attemptCountForDuration) . ' mins' : '--';

        return response()->json([
            'total_students' => count($uniqueStudentIds),
            'avg_duration' => $avgDuration
        ]);
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
        return Attempt::with(['exam' => function ($query) {
            $query->withTrashed();
        }])
            ->where('student_id', $request->user()->id)
            ->where('status', 'submitted')
            ->get();
    }

    public function toggleStatus(Request $request, $id)
    {
        if (! $request->user() instanceof \App\Models\Examiner) {
            abort(403, 'Unauthorized');
        }

        $exam = $request->user()->exams()->findOrFail($id);

        $newActiveState = !$exam->is_active;

        // When manually enabling, set enabled_at for 1hr window tracking
        $exam->update([
            'is_active' => $newActiveState,
            'enabled_at' => $newActiveState ? \Illuminate\Support\Carbon::now() : null
        ]);

        return response()->json($exam);
    }

    public function getAttempts(Request $request, $id)
    {
        if (! $request->user() instanceof \App\Models\Examiner) {
            abort(403, 'Unauthorized');
        }

        $exam = $request->user()->exams()->findOrFail($id);

        // Fetch attempts with student details
        $attempts = Attempt::where('exam_id', $exam->id)
            ->with(['student' => function ($query) {
                // Select columns that ACTUALLY exist
                $query->select('id', 'first_name', 'last_name', 'email', 'exam_number');
            }])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($attempts);
    }

    public function destroy(Request $request, $id)
    {
        if (! $request->user() instanceof \App\Models\Examiner) {
            abort(403, 'Unauthorized');
        }

        $exam = $request->user()->exams()->findOrFail($id);

        // Soft delete will preserve attempts and questions
        // $exam->questions()->delete();
        // $exam->attempts()->delete();

        $exam->delete();

        return response()->json(['message' => 'Exam deleted successfully']);
    }
}
