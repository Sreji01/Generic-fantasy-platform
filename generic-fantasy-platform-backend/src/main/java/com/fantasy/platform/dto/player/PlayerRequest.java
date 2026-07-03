package com.fantasy.platform.dto.player;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record PlayerRequest(
        @NotBlank String firstName,
        @NotBlank String lastName,
        @NotBlank String position,
        String realTeam,
        BigDecimal price,
        String imageUrl,
        @NotNull Long domainId
) {
}
