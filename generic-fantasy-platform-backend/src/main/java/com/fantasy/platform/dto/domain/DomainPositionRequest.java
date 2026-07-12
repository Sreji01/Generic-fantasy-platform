package com.fantasy.platform.dto.domain;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record DomainPositionRequest(
        @NotBlank String name,
        @NotNull @Min(1) Integer playerCount,
        @NotNull Double xPosition,
        @NotNull Double yPosition
) {
}
