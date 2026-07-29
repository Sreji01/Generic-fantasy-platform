package com.fantasy.platform.dto.fantasygame;

import java.util.List;

public record FantasyGameResponse(
        Long id,
        String name,
        String description,
        Integer fieldRows,
        Integer fieldCols,
        Integer benchRows,
        Integer benchCols,
        String backgroundImageUrl,
        String thumbnailUrl,
        Integer playerCount,
        List<FantasyGameScoringRuleResponse> scoringRules,
        List<FantasyGamePositionResponse> positions,
        Long createdById,
        String createdByUsername
) {
}
