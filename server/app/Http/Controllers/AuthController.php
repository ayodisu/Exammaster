<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rules\Password;
use App\Models\Candidate;
use \App\Notifications\VerifyEmailNotification;
use \App\Models\Examiner;

class AuthController extends Controller
{
    public function registerCandidate(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|min:2|max:50|regex:/^[a-zA-Z\s\-' . "']" . '+$/',
            'last_name' => 'required|string|min:2|max:50|regex:/^[a-zA-Z\s\-' . "']" . '+$/',
            'email' => 'required|email:rfc|max:255|unique:candidates',
            'password' => ['required', 'confirmed', Password::min(8)->letters()->mixedCase()->numbers()->symbols()],
            'phone_number' => 'required|string|regex:/^[\+]?[0-9]{7,15}$/',
            'date_of_birth' => 'nullable|date|before:today',
            'gender' => 'required|in:male,female,other',
            'address' => 'required|string|min:5|max:255',
        ]);

        $examNumber = 'EXM' . date('Y') . rand(10000, 99999);

        $candidate = Candidate::create([
            ...$validated,
            'password' => Hash::make($validated['password']),
            'exam_number' => $examNumber,
            'status' => 'active'
        ]);

        // Send verification email
        $candidate->notify(new VerifyEmailNotification());

        return response()->json([
            'message' => 'Registration successful! Please check your email to verify your account.',
            'requires_verification' => true
        ], 201);
    }

    public function registerExaminer(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|min:2|max:100',
            'email' => 'required|email:rfc|max:255|unique:examiners',
            'password' => ['required', 'confirmed', Password::min(8)->letters()->mixedCase()->numbers()->symbols()],
        ]);

        $examiner = Examiner::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'is_admin' => false,
            'status' => 'active',
        ]);

        $token = $examiner->createToken('examiner-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $examiner->id,
                'name' => $examiner->name,
                'email' => $examiner->email,
                'is_admin' => $examiner->is_admin,
                'role' => 'examiner'
            ]
        ], 201);
    }

    public function loginCandidate(Request $request)
    {
        $request->validate([
            'email' => 'required|email|max:255',
            'password' => 'required|string|max:128',
        ]);

        $candidate = Candidate::where('email', $request->email)->first();

        if (! $candidate || ! Hash::check($request->password, $candidate->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        // Check if account is suspended
        if ($candidate->status === 'suspended') {
            return response()->json([
                'message' => 'Your account has been suspended. Please contact an administrator.',
            ], 403);
        }

        // Check if email is verified
        if (!$candidate->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Please verify your email address first.',
                'email_not_verified' => true,
                'email' => $candidate->email
            ], 403);
        }

        $token = $candidate->createToken('candidate-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $candidate->id,
                'name' => $candidate->first_name . ' ' . $candidate->last_name,
                'email' => $candidate->email,
                'exam_number' => $candidate->exam_number,
                'role' => 'student'
            ]
        ]);
    }

    public function loginExaminer(Request $request)
    {
        $request->validate([
            'email' => 'required|email|max:255',
            'password' => 'required|string|max:128',
        ]);

        $examiner = Examiner::where('email', $request->email)->first();

        if (! $examiner || ! Hash::check($request->password, $examiner->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        // Check if account is suspended
        if ($examiner->status === 'suspended') {
            return response()->json([
                'message' => 'Your account has been suspended. Please contact an administrator.',
            ], 403);
        }

        $token = $examiner->createToken('examiner-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $examiner->id,
                'name' => $examiner->name,
                'email' => $examiner->email,
                'is_admin' => $examiner->is_admin,
                'role' => 'examiner'
            ]
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        if ($user instanceof Candidate) {
            $validated = $request->validate([
                'first_name' => 'sometimes|string|min:2|max:50',
                'last_name' => 'sometimes|string|min:2|max:50',
                'phone_number' => 'sometimes|string|regex:/^[\+]?[0-9]{7,15}$/',
                'address' => 'sometimes|string|min:5|max:255',
                'password' => ['sometimes', 'confirmed', Password::min(8)->letters()->mixedCase()->numbers()->symbols()],
            ]);

            if (isset($validated['password'])) {
                $validated['password'] = Hash::make($validated['password']);
            }

            $user->update($validated);
        } elseif ($user instanceof Examiner) {
            $validated = $request->validate([
                'name' => 'sometimes|string|min:2|max:100',
                'password' => ['sometimes', 'confirmed', Password::min(8)->letters()->mixedCase()->numbers()->symbols()],
            ]);

            if (isset($validated['password'])) {
                $validated['password'] = Hash::make($validated['password']);
            }

            $user->update($validated);
        }

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => $user->fresh(),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }
}
