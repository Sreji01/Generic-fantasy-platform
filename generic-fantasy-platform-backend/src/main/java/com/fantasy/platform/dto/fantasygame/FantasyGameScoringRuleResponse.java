package com.fantasy.platform.dto.fantasygame;

import java.util.List;

public record FantasyGameScoringRuleResponse(
        Long id,
        String name,
        boolean variesByPosition,
        Double points,
        List<ScoringRulePositionValueResponse> positionValues
) {
}
