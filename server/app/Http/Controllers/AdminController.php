<?php

namespace App\Http\Controllers;

use App\Models\Candidate;
use App\Models\Examiner;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function listUsers(Request $request)
    {
        $type = $request->query('type', 'all');

        $data = [];

        if ($type === 'all' || $type === 'candidate') {
            $data['candidates'] = Candidate::select('id', 'first_name', 'last_name', 'email', 'exam_number', 'status', 'created_at')
                ->withCount('attempts')
                ->orderBy('created_at', 'desc')
                ->get();
        }

        if ($type === 'all' || $type === 'examiner') {
            $data['examiners'] = Examiner::select('id', 'name', 'email', 'is_admin', 'status', 'created_at')
                ->withCount('exams')
                ->orderBy('created_at', 'desc')
                ->get();
        }

        return response()->json($data);
    }

    public function updateUserStatus(Request $request, $type, $id)
    {
        $request->validate([
            'status' => 'required|in:active,suspended',
        ]);

        $user = $this->findUser($type, $id);

        if (!$user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        // Prevent self-suspension
        if ($type === 'examiner' && $user->id === $request->user()->id) {
            return response()->json(['message' => 'You cannot suspend your own account.'], 403);
        }

        $user->update(['status' => $request->status]);

        // Revoke tokens if suspended
        if ($request->status === 'suspended') {
            $user->tokens()->delete();
        }

        return response()->json([
            'message' => ucfirst($type) . ' status updated to ' . $request->status . '.',
            'user' => $user->fresh(),
        ]);
    }

    public function deleteUser(Request $request, $type, $id)
    {
        $user = $this->findUser($type, $id);

        if (!$user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        // Prevent self-deletion
        if ($type === 'examiner' && $user->id === $request->user()->id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 403);
        }

        // Revoke tokens
        $user->tokens()->delete();

        $user->delete();

        return response()->json(['message' => ucfirst($type) . ' deleted successfully.']);
    }

    private function findUser(string $type, $id)
    {
        return match ($type) {
            'candidate' => Candidate::find($id),
            'examiner' => Examiner::find($id),
            default => null,
        };
    }
}
