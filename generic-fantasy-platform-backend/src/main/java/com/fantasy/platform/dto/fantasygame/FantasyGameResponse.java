package com.fantasy.platform.dto.fantasygame;

import java.time.LocalDate;
import java.util.List;

public record FantasyGameResponse(
        Long id,
        String name,
        String description,
        LocalDate startDate,
        LocalDate endDate,
        Integer fieldRows,
        Integer fieldCols,
        Integer benchRows,
        Integer benchCols,
        Integer pickFieldRows,
        Integer pickFieldCols,
        Integer pickBenchRows,
        Integer pickBenchCols,
        Double budget,
        String currency,
        String backgroundImageUrl,
        String benchBackgroundImageUrl,
        String thumbnailUrl,
        Integer playerCount,
        List<FantasyGameScoringRuleResponse> scoringRules,
        List<FantasyGamePositionResponse> positions,
        List<FantasyGamePositionResponse> pickPositions,
        Long createdById,
        String createdByUsername
) {
}
