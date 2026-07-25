package com.fantasy.platform.dto.domain;

import java.util.List;

public record DomainScoringRuleResponse(
        Long id,
        String name,
        boolean variesByPosition,
        Double points,
        List<ScoringRulePositionValueResponse> positionValues
) {
}
