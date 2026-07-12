package com.fantasy.platform.dto.domain;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record DomainRequest(
        @NotBlank String name,
        String description,
        @Valid List<DomainScoringRuleRequest> scoringRules,
        @Valid List<DomainPositionRequest> positions
) {
}
