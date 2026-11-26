<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use App\Services\JwtService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function __construct(private JwtService $jwt) {}

    public function demoAccounts(): JsonResponse
    {
        $users = User::with('tenant')->where('is_active', true)->get();

        return response()->json([
            'accounts' => $users->map(fn (User $u) => $u->toApiArray())->values(),
            'exchangeRateGbpToTry' => 44.2,
        ]);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $emailKey = 'login_fail:'.strtolower($validated['email']);
        $lockKey = 'login_lock:'.strtolower($validated['email']);

        if (Cache::has($lockKey)) {
            return response()->json([
                'error' => 'Account temporarily locked for 15 minutes after 5 failed attempts (REQ-1.4).',
            ], 429);
        }

        $user = User::with('tenant')
            ->whereRaw('LOWER(email) = ?', [strtolower($validated['email'])])
            ->where('is_active', true)
            ->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            $attempts = (int) Cache::get($emailKey, 0) + 1;
            Cache::put($emailKey, $attempts, now()->addMinutes(10));
            if ($attempts >= 5) {
                Cache::put($lockKey, true, now()->addMinutes(15));
            }

            return response()->json(['error' => 'Invalid credentials'], 401);
        }

        Cache::forget($emailKey);
        Cache::forget($lockKey);

        $token = $this->jwt->sign($user);

        AuditLog::create([
            'id' => 'aud-'.Str::lower(Str::random(8)),
            'tenant_id' => $user->tenant_id,
            'actor_name' => $user->full_name,
            'actor_role' => $user->role,
            'action' => 'USER_LOGIN',
            'resource' => "JWT({$user->role})",
            'severity' => 'INFO',
            'details' => "Authenticated into {$user->tenant?->name} via Laravel JWT.",
        ]);

        return response()->json([
            'token' => $token,
            'user' => $user->toApiArray(),
        ]);
    }

    public function demoSwitch(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'userId' => ['required', 'string'],
        ]);

        $user = User::with('tenant')
            ->where('id', $validated['userId'])
            ->where('is_active', true)
            ->first();

        if (! $user) {
            return response()->json(['error' => 'Demo user not found'], 404);
        }

        return response()->json([
            'token' => $this->jwt->sign($user),
            'user' => $user->toApiArray(),
        ]);
    }
}

