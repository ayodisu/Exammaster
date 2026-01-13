<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ExamController;
use App\Http\Controllers\ProctoringController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Auth Routes
Route::post('/candidate/register', [AuthController::class, 'registerCandidate']);
Route::post('/candidate/login', [AuthController::class, 'loginCandidate']);
Route::post('/examiner/login', [AuthController::class, 'loginExaminer']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::get('/students', function () {
        return \App\Models\Candidate::withCount('attempts')->get();
    });

    Route::get('/students/{id}/attempts', function ($id) {
        $student = \App\Models\Candidate::findOrFail($id);
        return $student->attempts()->with(['exam' => fn($q) => $q->withTrashed(), 'violations'])->orderBy('created_at', 'desc')->get();
    });

    // Assessment Management
    Route::get('/assessments', [ExamController::class, 'index']);
    Route::post('/assessments', [ExamController::class, 'store']);
    Route::get('/assessments/stats/overview', [App\Http\Controllers\ExamController::class, 'stats']);
    Route::get('/assessments/{id}', [App\Http\Controllers\ExamController::class, 'show']);
    Route::put('/assessments/{id}/status', [App\Http\Controllers\ExamController::class, 'toggleStatus']);
    Route::delete('/assessments/{id}', [App\Http\Controllers\ExamController::class, 'destroy']);
    Route::get('/assessments/{id}/attempts', [App\Http\Controllers\ExamController::class, 'getAttempts']);

    // Assessment Taking
    Route::post('/assessments/{id}/start', [ExamController::class, 'start']);
    Route::post('/attempts/{attemptId}/save', [ExamController::class, 'saveAnswer']);
    Route::post('/attempts/{attemptId}/finish', [ExamController::class, 'finish']);
    Route::get('/attempts', [ExamController::class, 'userAttempts']);

    // Proctoring
    Route::get('/violations', [ProctoringController::class, 'index']);
    Route::post('/violations', [ProctoringController::class, 'logViolation']);
});
