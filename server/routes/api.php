<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EmailVerificationController;
use App\Http\Controllers\ExamController;
use App\Http\Controllers\ForgotPasswordController;
use App\Http\Controllers\ResetPasswordController;
use App\Models\Candidate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Auth Routes (Public)
Route::post('/candidate/register', [AuthController::class, 'registerCandidate']);
Route::post('/candidate/login', [AuthController::class, 'loginCandidate']);
Route::post('/examiner/register', [AuthController::class, 'registerExaminer']);
Route::post('/examiner/login', [AuthController::class, 'loginExaminer']);

// Email Verification (public, uses signed URLs)
Route::get('/email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])->name('verification.verify');
Route::post('/email/resend', [EmailVerificationController::class, 'resend']);

// Password Reset Routes
Route::post('/password/email', [ForgotPasswordController::class, 'sendResetLinkEmail']);
Route::post('/password/reset', [ResetPasswordController::class, 'reset']);

// Authenticated Routes (shared by all roles)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::put('/user/profile', [AuthController::class, 'updateProfile']);

    // Assessment Viewing (shared — controller branches by role)
    Route::get('/assessments', [ExamController::class, 'index']);
    Route::get('/assessments/{id}', [ExamController::class, 'show']);

    // Assessment Taking (student)
    Route::post('/assessments/{id}/start', [ExamController::class, 'start']);
    Route::post('/attempts/{attemptId}/save', [ExamController::class, 'saveAnswer']);
    Route::post('/attempts/{attemptId}/finish', [ExamController::class, 'finish']);
    Route::get('/attempts', [ExamController::class, 'userAttempts']);
    Route::get('/attempts/{id}/detail', [ExamController::class, 'attemptDetail']);

    // Examiner-only Routes
    Route::middleware('examiner')->group(function () {
        Route::get('/students', function () {
            return Candidate::withCount('attempts')->get();
        });
        Route::get('/students/{id}/attempts', function ($id) {
            $student = Candidate::findOrFail($id);
            return $student->attempts()->with(['exam' => fn($q) => $q->withTrashed(), 'violations'])->orderBy('created_at', 'desc')->get();
        });

        // Assessment Management
        Route::post('/assessments', [ExamController::class, 'store']);
        Route::get('/assessments/stats/overview', [ExamController::class, 'stats']);
        Route::put('/assessments/{id}/status', [ExamController::class, 'toggleStatus']);
        Route::delete('/assessments/{id}', [ExamController::class, 'destroy']);
        Route::get('/assessments/{id}/attempts', [ExamController::class, 'getAttempts']);
        Route::delete('/assessments/{id}/attempts/{attemptId}', [ExamController::class, 'deleteAttempt']);
        Route::post('/assessments/{id}/questions/import', [ExamController::class, 'importQuestions']);
        Route::post('/questions/bulk-delete', [ExamController::class, 'deleteQuestions']);
        Route::post('/assessments/{id}/questions', [ExamController::class, 'addQuestion']);
        Route::put('/questions/{id}', [ExamController::class, 'updateQuestion']);
        Route::delete('/questions/{id}', [ExamController::class, 'deleteQuestion']);
    });

    // Super Admin Routes
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('/users', [AdminController::class, 'listUsers']);
        Route::put('/users/{type}/{id}/status', [AdminController::class, 'updateUserStatus']);
        Route::delete('/users/{type}/{id}', [AdminController::class, 'deleteUser']);
    });
});
