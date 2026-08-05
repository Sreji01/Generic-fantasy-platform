package com.fantasy.platform.dto.user;

import com.fantasy.platform.entity.UserRole;
import jakarta.validation.constraints.NotNull;

public record UpdateUserRoleRequest(
        @NotNull UserRole role
) {
}
