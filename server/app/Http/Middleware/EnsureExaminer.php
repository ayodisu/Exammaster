<?php

namespace App\Http\Middleware;

use App\Models\Examiner;
use Closure;
use Illuminate\Http\Request;

class EnsureExaminer
{
    public function handle(Request $request, Closure $next)
    {
        if (! $request->user() instanceof Examiner) {
            return response()->json(['message' => 'Unauthorized. Examiner access only.'], 403);
        }

        return $next($request);
    }
}
