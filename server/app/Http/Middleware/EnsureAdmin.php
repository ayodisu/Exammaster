<?php

namespace App\Http\Middleware;

use App\Models\Examiner;
use Closure;
use Illuminate\Http\Request;

class EnsureAdmin
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (! $user instanceof Examiner || ! $user->is_admin) {
            return response()->json(['message' => 'Unauthorized. Admin access only.'], 403);
        }

        return $next($request);
    }
}
