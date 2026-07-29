package com.fantasy.platform.dto.domain;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record DomainScoringRuleRequest(
        @NotBlank String name,
        boolean variesByPosition,
        Double points,
        @Valid List<ScoringRulePositionValueRequest> positionValues
) {
}
