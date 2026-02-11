<?php

namespace App\Http\Controllers;

use App\Models\Candidate;
use App\Notifications\WelcomeNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class EmailVerificationController extends Controller
{
    public function verify(Request $request, $id, $hash)
    {
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
        $candidate = Candidate::find($id);

        if (!$candidate || ! hash_equals((string) $hash, sha1($candidate->getEmailForVerification()))) {
            return redirect($frontendUrl . '/verify-success?error=invalid');
        }

        if ($candidate->hasVerifiedEmail()) {
            return redirect($frontendUrl . '/verify-success?error=already_verified');
        }

        $candidate->markEmailAsVerified();

        // Send welcome email with profile details
        try {
            $candidate->notify(new WelcomeNotification());
        } catch (\Exception $e) {
            // Log but don't block verification
            Log::error('Failed to send welcome email: ' . $e->getMessage());
        }

        // Auto-login: create a token so the frontend can redirect to dashboard
        $token = $candidate->createToken('candidate-token')->plainTextToken;

        $userData = base64_encode(json_encode([
            'id' => $candidate->id,
            'name' => $candidate->first_name . ' ' . $candidate->last_name,
            'email' => $candidate->email,
            'exam_number' => $candidate->exam_number,
            'role' => 'student'
        ]));

        return redirect($frontendUrl . '/verify-success?token=' . $token . '&user=' . $userData);
    }

    public function resend(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $candidate = Candidate::where('email', $request->email)->first();

        if (!$candidate) {
            return response()->json(['message' => 'If the email exists, a verification link has been sent.']);
        }

        if ($candidate->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email already verified.']);
        }

        $candidate->notify(new \App\Notifications\VerifyEmailNotification());

        return response()->json(['message' => 'Verification link sent!']);
    }
}
