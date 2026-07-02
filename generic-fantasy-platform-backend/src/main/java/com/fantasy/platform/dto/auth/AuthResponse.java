package com.fantasy.platform.dto.auth;

public record AuthResponse(
        String token,
        String username,
        String email,
        String role
) {
}
