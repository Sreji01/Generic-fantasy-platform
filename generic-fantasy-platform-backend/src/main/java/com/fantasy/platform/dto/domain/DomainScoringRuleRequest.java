package com.fantasy.platform.dto.domain;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record DomainScoringRuleRequest(
        @NotBlank String name,
        @NotNull Double points
) {
}
