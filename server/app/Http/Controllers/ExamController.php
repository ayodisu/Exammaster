<?php

namespace App\Http\Controllers;

use App\Models\Attempt;
use App\Models\Candidate;
use App\Models\Exam;
use App\Models\Question;
use App\Models\Response;
use App\Models\Examiner;
use App\Notifications\ExamDueNotification;
use App\Notifications\ExamResultNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use \Illuminate\Database\QueryException;
use \Illuminate\Support\Facades\Log;

class ExamController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if ($user instanceof \App\Models\Examiner) {
            $exams = Exam::with(['attempts', 'examiner:id,name'])->get();
            return $exams->map(function ($exam) {
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
                $exam->created_by = $exam->examiner->name ?? 'Unknown';
                unset($exam->attempts);
                return $exam;
            });
        }

        // For students: return all published exams with availability status + retake info
        $exams = Exam::where('is_published', true)->get();
        $studentId = $user->id;

        return $exams->map(function ($exam) use ($studentId) {
            $exam->can_take = $exam->is_active;

            // Count how many completed attempts this student has for this exam
            $exam->attempts_used = Attempt::where('student_id', $studentId)
                ->where('exam_id', $exam->id)
                ->whereIn('status', ['submitted', 'terminated'])
                ->count();

            // Check for an ongoing attempt
            $exam->has_ongoing = Attempt::where('student_id', $studentId)
                ->where('exam_id', $exam->id)
                ->where('status', 'ongoing')
                ->exists();

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
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'duration_minutes' => 'required|integer|min:1|max:600',
            'type' => 'required|in:exam,mock,test',
            'scheduled_at' => 'nullable|date|after_or_equal:now',
            'settings_json' => 'nullable|array',
            'max_retakes' => 'nullable|integer|min:0|max:10',
            'questions' => 'nullable|array',
            'questions.*.text' => 'required|string|max:5000',
            'questions.*.type' => 'required|string|in:mcq,tf',
            'questions.*.options' => 'required|array|min:2',
            'questions.*.correct_answer' => 'required|string',
        ]);

        $examData = collect($validated)->except('questions')->toArray();


        $hasSchedule = !empty($validated['scheduled_at']);

        $exam = $request->user()->exams()->create([
            ...$examData,
            'is_published' => true,
            'is_active' => false
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
        if ($request->user() instanceof Examiner) {
            return Exam::with(['questions', 'examiner:id,name'])->findOrFail($id);
        }

        return Exam::where('is_active', true)->with('questions')->findOrFail($id);
    }

    public function stats(Request $request)
    {
        $exams = $request->user()->exams()->withTrashed()->with('attempts')->get();

        $uniqueStudentIds = [];
        $totalDurations = 0;
        $attemptCountForDuration = 0;
        $allScores = [];
        $totalPassed = 0;
        $totalSubmitted = 0;
        $perExamStats = [];

        foreach ($exams as $exam) {
            $submitted = $exam->attempts->where('status', 'submitted');
            $examSubmittedCount = $submitted->count();
            $examAvgScore = $examSubmittedCount > 0 ? $submitted->avg('score') : 0;
            $examPassed = $submitted->where('score', '>=', 50)->count();

            $totalSubmitted += $examSubmittedCount;
            $totalPassed += $examPassed;

            $perExamStats[] = [
                'id' => $exam->id,
                'title' => $exam->title,
                'type' => $exam->type,
                'attempts' => $examSubmittedCount,
                'avg_score' => round($examAvgScore, 1),
                'pass_rate' => $examSubmittedCount > 0 ? round(($examPassed / $examSubmittedCount) * 100, 1) : 0,
            ];

            foreach ($submitted as $attempt) {
                $uniqueStudentIds[$attempt->student_id] = true;
                $allScores[] = $attempt->score;

                $start = Carbon::parse($attempt->started_at);
                $end = Carbon::parse($attempt->submitted_at);
                $totalDurations += $end->diffInMinutes($start);
                $attemptCountForDuration++;
            }
        }

        $avgDuration = $attemptCountForDuration > 0 ? round($totalDurations / $attemptCountForDuration) . ' mins' : '--';
        $overallPassRate = $totalSubmitted > 0 ? round(($totalPassed / $totalSubmitted) * 100, 1) : 0;

        // Score distribution (0-20, 21-40, 41-60, 61-80, 81-100)
        $distribution = [
            '0-20' => 0,
            '21-40' => 0,
            '41-60' => 0,
            '61-80' => 0,
            '81-100' => 0,
        ];
        foreach ($allScores as $score) {
            if ($score <= 20) $distribution['0-20']++;
            elseif ($score <= 40) $distribution['21-40']++;
            elseif ($score <= 60) $distribution['41-60']++;
            elseif ($score <= 80) $distribution['61-80']++;
            else $distribution['81-100']++;
        }

        return response()->json([
            'total_students' => count($uniqueStudentIds),
            'total_exams' => $exams->count(),
            'total_attempts' => $totalSubmitted,
            'avg_duration' => $avgDuration,
            'overall_pass_rate' => $overallPassRate,
            'avg_score' => count($allScores) > 0 ? round(array_sum($allScores) / count($allScores), 1) : 0,
            'score_distribution' => $distribution,
            'per_exam' => $perExamStats,
        ]);
    }

    public function start(Request $request, $id)
    {
        $exam = Exam::findOrFail($id);

        if (!$exam->is_active) {
            return response()->json(['message' => 'This exam is not currently active.'], 403);
        }

        $user = $request->user();

        // Check for an ongoing attempt first — resume it
        $ongoingAttempt = Attempt::where('student_id', $user->id)
            ->where('exam_id', $exam->id)
            ->where('status', 'ongoing')
            ->first();

        if ($ongoingAttempt) {
            $attempt = $ongoingAttempt;
        } else {
            // Count completed attempts
            $completedAttempts = Attempt::where('student_id', $user->id)
                ->where('exam_id', $exam->id)
                ->whereIn('status', ['submitted', 'terminated'])
                ->count();

            // max_retakes = number of EXTRA attempts beyond the first
            // Total allowed attempts = 1 + max_retakes
            $totalAllowed = 1 + $exam->max_retakes;

            if ($completedAttempts >= $totalAllowed) {
                return response()->json([
                    'message' => 'You have used all your attempts for this exam.',
                    'attempts_used' => $completedAttempts,
                    'max_retakes' => $exam->max_retakes,
                ], 403);
            }

            // Create a new attempt
            $attempt = Attempt::create([
                'student_id' => $user->id,
                'exam_id' => $exam->id,
                'started_at' => Carbon::now(),
                'status' => 'ongoing',
            ]);
        }

        // Load exam with questions
        $attempt->load('exam');

        $questions = $attempt->exam->questions;
        $seed = $attempt->id;

        $shuffled = $questions->sortBy(function ($q) use ($seed) {
            return md5($q->id . $seed);
        })->values();

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

            $isCorrect = $validated['student_answer'] == $question->correct_answer;

            if (!$isCorrect && !empty($question->options_json)) {
                $options = is_string($question->options_json) ? json_decode($question->options_json, true) : $question->options_json;

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
            Log::warning('Failed to send result email: ' . $e->getMessage());
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
        $exam = Exam::findOrFail($id);

        $newActiveState = !$exam->is_active;

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
                    Log::warning('Failed to send exam notification to candidate #' . $candidate->id . ': ' . $e->getMessage());
                }
            }
        }

        return response()->json($exam);
    }

    public function getAttempts(Request $request, $id)
    {
        $exam = Exam::findOrFail($id);

        $attempts = Attempt::where('exam_id', $exam->id)
            ->with(['student' => function ($query) {
                $query->select('id', 'first_name', 'last_name', 'email', 'exam_number');
            }])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($attempts);
    }

    public function importQuestions(Request $request, $id)
    {
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

            if (count($row) < 7 || empty($row[0])) continue;

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
        if (! $request->user() instanceof Examiner) abort(403);

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
        if (! $request->user() instanceof Examiner) abort(403);

        $question = Question::findOrFail($id);
        $exam = $request->user()->exams()->findOrFail($question->exam_id);

        Response::where('question_id', $question->id)->delete();

        $question->delete();

        return response()->json(['message' => 'Question deleted']);
    }

    public function deleteQuestions(Request $request)
    {


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
        $exam = Exam::findOrFail($examId);
        $attempt = Attempt::where('exam_id', $exam->id)->findOrFail($attemptId);

        $attempt->delete();

        return response()->json(['message' => 'Attempt deleted successfully']);
    }

    public function destroy(Request $request, $id)
    {
        if (! $request->user() instanceof Examiner) {
            abort(403, 'Unauthorized');
        }

        $exam = $request->user()->exams()->findOrFail($id);

        $exam->delete();

        return response()->json(['message' => 'Exam deleted successfully']);
    }
}
