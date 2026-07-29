package com.fantasy.platform.dto.fantasygame;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record FantasyGameRequest(
        @NotBlank String name,
        String description,
        @NotNull @Min(1) Integer fieldRows,
        @NotNull @Min(1) Integer fieldCols,
        @Min(1) Integer benchRows,
        @Min(1) Integer benchCols,
        String backgroundImageUrl,
        String thumbnailUrl,
        @Valid List<FantasyGameScoringRuleRequest> scoringRules,
        @Valid List<FantasyGamePositionRequest> positions
) {
}
