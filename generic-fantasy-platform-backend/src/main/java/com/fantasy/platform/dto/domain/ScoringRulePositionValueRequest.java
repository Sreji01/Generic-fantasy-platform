package com.fantasy.platform.dto.domain;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ScoringRulePositionValueRequest(
        @NotBlank String positionName,
        @NotNull Double points
) {
}
