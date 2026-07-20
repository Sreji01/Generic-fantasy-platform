package com.fantasy.platform.dto.domain;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record DomainRequest(
        @NotBlank String name,
        String description,
        @NotNull @Min(1) Integer fieldRows,
        @NotNull @Min(1) Integer fieldCols,
        String backgroundImageUrl,
        String thumbnailUrl,
        @Valid List<DomainScoringRuleRequest> scoringRules,
        @Valid List<DomainPositionRequest> positions
) {
}
