<?php

namespace App\Services;

use App\Models\User;

class JwtService
{
    private function secret(): string
    {
        return (string) config('app.key', 'drivehub-cmse473-secret');
    }

    private function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private function base64UrlDecode(string $data): string
    {
        $pad = strlen($data) % 4;
        if ($pad > 0) {
            $data .= str_repeat('=', 4 - $pad);
        }

        return base64_decode(strtr($data, '-_', '+/')) ?: '';
    }

    public function sign(User $user, int $ttlSeconds = 28800): string
    {
        $header = $this->base64UrlEncode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $payload = $this->base64UrlEncode(json_encode([
            'sub' => $user->id,
            'tenant_id' => $user->tenant_id,
            'role' => $user->role,
            'iat' => time(),
            'exp' => time() + $ttlSeconds,
        ]));
        $signature = $this->base64UrlEncode(
            hash_hmac('sha256', "{$header}.{$payload}", $this->secret(), true)
        );

        return "{$header}.{$payload}.{$signature}";
    }

    public function verify(string $token): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }
        [$header, $payload, $sig] = $parts;
        $expected = $this->base64UrlEncode(
            hash_hmac('sha256', "{$header}.{$payload}", $this->secret(), true)
        );
        if (! hash_equals($expected, $sig)) {
            return null;
        }
        $decoded = json_decode($this->base64UrlDecode($payload), true);
        if (! is_array($decoded) || (($decoded['exp'] ?? 0) < time())) {
            return null;
        }

        return $decoded;
    }
}

