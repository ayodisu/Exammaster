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
        return \App\Models\User::where('role', 'student')->get();
    });

    // Exam Management
    Route::get('/exams', [ExamController::class, 'index']);
    Route::post('/exams', [ExamController::class, 'store']);
    Route::get('/exams/stats/overview', [App\Http\Controllers\ExamController::class, 'stats']);
    Route::get('/exams/{id}', [App\Http\Controllers\ExamController::class, 'show']);
    Route::put('/exams/{id}/status', [App\Http\Controllers\ExamController::class, 'toggleStatus']);
    Route::get('/exams/{id}/attempts', [App\Http\Controllers\ExamController::class, 'getAttempts']);

    // Exam Taking
    Route::post('/exams/{id}/start', [ExamController::class, 'start']);
    Route::post('/attempts/{attemptId}/save', [ExamController::class, 'saveAnswer']);
    Route::post('/attempts/{attemptId}/finish', [ExamController::class, 'finish']);
    Route::get('/attempts', [ExamController::class, 'userAttempts']);

    // Proctoring
    Route::post('/violations', [ProctoringController::class, 'logViolation']);
});
