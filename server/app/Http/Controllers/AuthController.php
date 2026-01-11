<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function registerCandidate(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string',
            'last_name' => 'required|string',
            'email' => 'required|email|unique:candidates',
            'password' => ['required', 'confirmed', \Illuminate\Validation\Rules\Password::min(8)->letters()->mixedCase()->numbers()->symbols()],
            'phone_number' => 'required|string',
            'date_of_birth' => 'nullable|date',
            'gender' => 'required|in:male,female,other',
            'address' => 'required|string',
        ]);

        $examNumber = 'EXM' . date('Y') . rand(10000, 99999);
        // Ensure uniqueness loop could be added here

        $candidate = \App\Models\Candidate::create([
            ...$validated,
            'password' => Hash::make($validated['password']),
            'exam_number' => $examNumber,
            'status' => 'active'
        ]);

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
        ], 201);
    }

    public function loginCandidate(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $candidate = \App\Models\Candidate::where('email', $request->email)->first();

        if (! $candidate || ! Hash::check($request->password, $candidate->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
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
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $examiner = \App\Models\Examiner::where('email', $request->email)->first();

        if (! $examiner || ! Hash::check($request->password, $examiner->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
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

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }
}
