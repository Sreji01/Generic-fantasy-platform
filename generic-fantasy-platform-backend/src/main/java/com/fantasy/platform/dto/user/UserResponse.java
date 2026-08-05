package com.fantasy.platform.dto.user;

import com.fantasy.platform.entity.UserRole;

import java.time.LocalDateTime;

public record UserResponse(
        Long id,
        String username,
        String email,
        UserRole role,
        LocalDateTime createdAt
) {
}
