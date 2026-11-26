<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Services\JwtService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class JwtAuthMiddleware
{
    public function __construct(private JwtService $jwt) {}

    public function handle(Request $request, Closure $next): Response
    {
        $header = (string) $request->header('Authorization', '');
        if (! str_starts_with($header, 'Bearer ')) {
            return response()->json(['error' => 'Authentication required'], 401);
        }

        $claims = $this->jwt->verify(substr($header, 7));
        if (! $claims || empty($claims['sub'])) {
            return response()->json(['error' => 'Invalid or expired JWT token'], 401);
        }

        $user = User::with('tenant')->where('id', $claims['sub'])->where('is_active', true)->first();
        if (! $user) {
            return response()->json(['error' => 'User account inactive'], 401);
        }

        $request->attributes->set('auth_user', $user);

        return $next($request);
    }
}

