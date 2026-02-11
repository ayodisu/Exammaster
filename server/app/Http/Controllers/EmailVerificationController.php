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
        $candidate = Candidate::find($id);

        if (!$candidate || ! hash_equals((string) $hash, sha1($candidate->getEmailForVerification()))) {
            return response()->json(['message' => 'Invalid or expired verification link.'], 403);
        }

        if ($candidate->hasVerifiedEmail()) {
            // If already verified, still return success so the user can be logged in or redirected
            return response()->json([
                'message' => 'Email already verified.',
                'verified' => true,
                'already_verified' => true
            ], 200);
        }

        $candidate->markEmailAsVerified();

        // Send welcome email
        try {
            $candidate->notify(new WelcomeNotification());
        } catch (\Exception $e) {
            Log::error('Failed to send welcome email: ' . $e->getMessage());
        }

        // Auto-login token
        $token = $candidate->createToken('candidate-token')->plainTextToken;

        return response()->json([
            'message' => 'Email verified successfully!',
            'verified' => true,
            'token' => $token,
            'user' => [
                'id' => $candidate->id,
                'name' => $candidate->first_name . ' ' . $candidate->last_name,
                'email' => $candidate->email,
                'exam_number' => $candidate->exam_number,
                'role' => 'student'
            ]
        ], 200);
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
