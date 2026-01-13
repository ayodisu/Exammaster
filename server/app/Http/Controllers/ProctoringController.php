<?php

namespace App\Http\Controllers;

use App\Models\Attempt;
use App\Models\Violation;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class ProctoringController extends Controller
{
    public function index()
    {
        return Violation::with(['attempt.student', 'attempt.exam' => fn($q) => $q->withTrashed()])
            ->latest('occurred_at')
            ->get();
    }

    public function logViolation(Request $request)
    {
        $validated = $request->validate([
            'attempt_id' => 'required|exists:attempts,id',
            'type' => 'required|string',
            'details' => 'nullable|string',
        ]);

        $attempt = Attempt::where('student_id', $request->user()->id)->findOrFail($validated['attempt_id']);

        $violation = Violation::create([
            'attempt_id' => $attempt->id,
            'type' => $validated['type'],
            'occurred_at' => Carbon::now(),
            'details' => $validated['details'],
        ]);

        return response()->json(['message' => 'Violation logged'], 201);
    }
}
