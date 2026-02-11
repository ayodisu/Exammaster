<?php

namespace App\Http\Controllers;

use App\Models\Attempt;
use App\Models\Candidate;
use App\Models\Exam;
use App\Models\Question;
use App\Models\Response;
use App\Notifications\ExamDueNotification;
use App\Notifications\ExamResultNotification;
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
            'title' => 'required|string|max:255',
            'duration_minutes' => 'required|integer|min:1|max:600',
            'type' => 'required|in:exam,mock,test',
            'scheduled_at' => 'nullable|date|after_or_equal:now',
            'settings_json' => 'nullable|array',
            'questions' => 'nullable|array',
            'questions.*.text' => 'required|string|max:5000',
            'questions.*.type' => 'required|string|in:mcq,tf',
            'questions.*.options' => 'required|array|min:2',
            'questions.*.correct_answer' => 'required|string',
        ]);

        $examData = collect($validated)->except('questions')->toArray();

        // If exam has a scheduled date, it should start as inactive
        // The scheduler will enable it at the scheduled time
        $hasSchedule = !empty($validated['scheduled_at']);

        $exam = $request->user()->exams()->create([
            ...$examData,
            'is_published' => true,
            'is_active' => false // Default to inactive so examiner can upload questions first
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
        
        if (!$exam->is_active) {
            return response()->json(['message' => 'This exam is not currently active.'], 403);
        }

        $user = $request->user();

        try {
            $attempt = Attempt::firstOrCreate(
                [
                    'student_id' => $user->id,
                    'exam_id' => $exam->id
                ],
                [
                    'started_at' => Carbon::now(),
                    'status' => 'ongoing',
                ]
            );
        } catch (\Illuminate\Database\QueryException $e) {
            // Handle race condition: If insertion fails due to duplicate entry, fetch the existing attempt
            if ($e->errorInfo[1] == 1062) {
                $attempt = Attempt::where('student_id', $user->id)
                    ->where('exam_id', $exam->id)
                    ->firstOrFail();
            } else {
                throw $e;
            }
        }

        // Load exam without questions first
        $attempt->load('exam');

        // Get questions and shuffle deterministically based on attempt ID
        $questions = $attempt->exam->questions;
        $seed = $attempt->id;

        $shuffled = $questions->sortBy(function ($q) use ($seed) {
            return md5($q->id . $seed);
        })->values();

        // Set the shuffled questions back to the relation
        $attempt->exam->setRelation('questions', $shuffled);

        return response()->json($attempt);
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
            // Direct Check (if ID == Correct Answer Text, usually for Manual questions with ID=Text)
            $isCorrect = $validated['student_answer'] == $question->correct_answer;

            // Fail-safe: Check if Option ID matches but Text was stored as Correct Answer (Common in Imports)
            if (!$isCorrect && !empty($question->options_json)) {
                $options = is_string($question->options_json) ? json_decode($question->options_json, true) : $question->options_json;

                // Find option where ID matches student answer
                $selectedOption = collect($options)->firstWhere('id', $validated['student_answer']);

                if ($selectedOption) {
                    $isCorrect = $selectedOption['text'] == $question->correct_answer;
                }
            }
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

        // Send result notification email
        try {
            $student = $attempt->student;
            if ($student) {
                $student->notify(new ExamResultNotification($attempt->exam, $score));
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('Failed to send result email: ' . $e->getMessage());
        }

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

    public function attemptDetail(Request $request, $attemptId)
    {
        $attempt = Attempt::with(['exam' => function ($q) {
            $q->withTrashed()->with('questions');
        }, 'responses.question'])
            ->where('student_id', $request->user()->id)
            ->findOrFail($attemptId);

        $questions = $attempt->exam->questions;
        $responses = $attempt->responses->keyBy('question_id');

        $breakdown = $questions->map(function ($question) use ($responses) {
            $response = $responses->get($question->id);
            return [
                'question_id' => $question->id,
                'question_text' => $question->text,
                'question_type' => $question->type,
                'options' => $question->options_json,
                'correct_answer' => $question->correct_answer,
                'student_answer' => $response ? $response->student_answer : null,
                'is_correct' => $response ? $response->is_correct : false,
                'time_spent_seconds' => $response ? $response->time_spent_seconds : 0,
                'explanation' => $question->explanation,
            ];
        });

        $totalQuestions = $questions->count();
        $answered = $breakdown->filter(fn($b) => $b['student_answer'] !== null)->count();
        $correct = $breakdown->filter(fn($b) => $b['is_correct'])->count();
        $incorrect = $answered - $correct;
        $unanswered = $totalQuestions - $answered;
        $totalTimeSpent = $breakdown->sum('time_spent_seconds');
        $avgTimePerQuestion = $totalQuestions > 0 ? round($totalTimeSpent / $totalQuestions) : 0;

        // Accuracy by question type
        $typeStats = $breakdown->groupBy('question_type')->map(function ($group, $type) {
            $total = $group->count();
            $correctCount = $group->filter(fn($b) => $b['is_correct'])->count();
            return [
                'type' => $type,
                'total' => $total,
                'correct' => $correctCount,
                'accuracy' => $total > 0 ? round(($correctCount / $total) * 100) : 0,
            ];
        })->values();

        return response()->json([
            'attempt' => [
                'id' => $attempt->id,
                'score' => $attempt->score,
                'status' => $attempt->status,
                'started_at' => $attempt->started_at,
                'submitted_at' => $attempt->submitted_at,
            ],
            'exam' => [
                'id' => $attempt->exam->id,
                'title' => $attempt->exam->title,
                'type' => $attempt->exam->type,
                'duration_minutes' => $attempt->exam->duration_minutes,
            ],
            'summary' => [
                'total_questions' => $totalQuestions,
                'answered' => $answered,
                'correct' => $correct,
                'incorrect' => $incorrect,
                'unanswered' => $unanswered,
                'total_time_spent_seconds' => $totalTimeSpent,
                'avg_time_per_question_seconds' => $avgTimePerQuestion,
                'type_stats' => $typeStats,
            ],
            'breakdown' => $breakdown->values(),
        ]);
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
            'enabled_at' => $newActiveState ? Carbon::now() : null
        ]);

        // Notify students who haven't taken this exam when it is activated
        if ($newActiveState) {
            $takenStudentIds = Attempt::where('exam_id', $exam->id)->pluck('student_id');
            /** @var \Illuminate\Database\Eloquent\Collection<int, \App\Models\Candidate> $candidates */
            $candidates = Candidate::whereNotIn('id', $takenStudentIds)
                ->whereNotNull('email_verified_at')
                ->get();

            foreach ($candidates as $candidate) {
                try {
                    $candidate->notify(new ExamDueNotification($exam));
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::warning('Failed to send exam notification to candidate #' . $candidate->id . ': ' . $e->getMessage());
                }
            }
        }

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

    public function importQuestions(Request $request, $id)
    {
        if (! $request->user() instanceof \App\Models\Examiner) {
            abort(403, 'Unauthorized');
        }

        $request->validate([
            'file' => 'required|file|mimes:csv,txt',
        ]);

        $exam = $request->user()->exams()->findOrFail($id);
        $file = $request->file('file');

        $handle = fopen($file->getPathname(), 'r');
        $header = fgetcsv($handle);

        $count = 0;
        while (($row = fgetcsv($handle)) !== false) {
            // Expected Format:
            // 0: Text, 1: Type (mcq/tf), 2: OptA, 3: OptB, 4: OptC, 5: OptD, 6: Correct (A/B/C/D)

            if (count($row) < 7 || empty($row[0])) continue; // Check for minimum columns and non-empty question text

            $text = $row[0];
            $type = strtolower($row[1]);
            $optA = $row[2];
            $optB = $row[3];
            $optC = $row[4];
            $optD = $row[5];
            $correctLetter = strtoupper($row[6]);

            $options = [];
            if ($type === 'mcq') {
                // Use Text as ID to match Manual Creation logic and Frontend expectations
                $options = [
                    ['id' => $optA, 'text' => $optA],
                    ['id' => $optB, 'text' => $optB],
                    ['id' => $optC, 'text' => $optC],
                    ['id' => $optD, 'text' => $optD],
                ];
            } elseif ($type === 'tf') {
                $options = [
                    ['id' => 'True', 'text' => 'True'],
                    ['id' => 'False', 'text' => 'False'],
                ];
            }

            // Determine correct answer value
            $correctAnswer = '';
            if ($type === 'mcq') {
                $map = ['A' => $optA, 'B' => $optB, 'C' => $optC, 'D' => $optD];
                $correctAnswer = $map[$correctLetter] ?? $optA;
            } else {
                $correctAnswer = strtolower($correctLetter) === 'true' || strtoupper($correctLetter) === 'T' ? 'True' : 'False';
            }

            $exam->questions()->create([
                'text' => $text,
                'type' => $type,
                'options_json' => $options,
                'correct_answer' => $correctAnswer
            ]);
            $count++;
        }
        fclose($handle);

        return response()->json(['message' => "Successfully imported {$count} questions"]);
    }

    public function addQuestion(Request $request, $id)
    {
        if (! $request->user() instanceof \App\Models\Examiner) abort(403);

        $exam = $request->user()->exams()->findOrFail($id);

        $validated = $request->validate([
            'text' => 'required|string|max:5000',
            'type' => 'required|in:mcq,tf',
            'options_json' => 'required|array|min:2',
            'correct_answer' => 'required|string|max:1000',
        ]);

        $question = $exam->questions()->create($validated);

        return response()->json($question, 201);
    }

    public function updateQuestion(Request $request, $id)
    {
        if (! $request->user() instanceof \App\Models\Examiner) abort(403);

        $question = Question::findOrFail($id);
        $exam = $request->user()->exams()->findOrFail($question->exam_id);

        $validated = $request->validate([
            'text' => 'required|string|max:5000',
            'type' => 'required|in:mcq,tf',
            'options_json' => 'required|array|min:2',
            'correct_answer' => 'required|string|max:1000',
        ]);

        $question->update($validated);

        return response()->json($question);
    }

    public function deleteQuestion(Request $request, $id)
    {
        if (! $request->user() instanceof \App\Models\Examiner) abort(403);

        $question = Question::findOrFail($id);
        $exam = $request->user()->exams()->findOrFail($question->exam_id);

        Response::where('question_id', $question->id)->delete();

        $question->delete();

        return response()->json(['message' => 'Question deleted']);
    }

    public function deleteQuestions(Request $request)
    {
        if (! $request->user() instanceof \App\Models\Examiner) abort(403);

        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:questions,id'
        ]);

        $ids = $request->ids;

        $examinerId = $request->user()->id;

        Response::whereIn('question_id', $ids)->delete();

        $deletedCount = Question::whereIn('id', $ids)
            ->whereHas('exam', function ($query) use ($examinerId) {
                $query->where('examiner_id', $examinerId);
            })
            ->delete();

        return response()->json(['message' => "Deleted {$deletedCount} questions"]);
    }

    public function deleteAttempt(Request $request, $examId, $attemptId)
    {
        if (! $request->user() instanceof \App\Models\Examiner) abort(403);

        $exam = $request->user()->exams()->findOrFail($examId);
        $attempt = Attempt::where('exam_id', $exam->id)->findOrFail($attemptId);

        $attempt->delete();

        return response()->json(['message' => 'Attempt deleted successfully']);
    }

    public function destroy(Request $request, $id)
    {
        if (! $request->user() instanceof \App\Models\Examiner) {
            abort(403, 'Unauthorized');
        }

        $exam = $request->user()->exams()->findOrFail($id);

        $exam->delete();

        return response()->json(['message' => 'Exam deleted successfully']);
    }
}
