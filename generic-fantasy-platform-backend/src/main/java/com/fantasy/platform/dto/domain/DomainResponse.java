package com.fantasy.platform.dto.domain;

import java.util.List;

public record DomainResponse(
        Long id,
        String name,
        String description,
        Integer fieldRows,
        Integer fieldCols,
        String backgroundImageUrl,
        String thumbnailUrl,
        Integer playerCount,
        List<DomainScoringRuleResponse> scoringRules,
        List<DomainPositionResponse> positions,
        Long createdById,
        String createdByUsername
) {
}
