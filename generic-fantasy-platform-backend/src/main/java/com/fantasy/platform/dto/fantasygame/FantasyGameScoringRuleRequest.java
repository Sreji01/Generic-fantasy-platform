package com.fantasy.platform.dto.fantasygame;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record FantasyGameScoringRuleRequest(
        @NotBlank String name,
        boolean variesByPosition,
        Double points,
        @Valid List<ScoringRulePositionValueRequest> positionValues
) {
}
