package com.fantasy.platform.dto.domain;

import jakarta.validation.constraints.NotBlank;

public record DomainRequest(
        @NotBlank String name,
        String description,
        String scoringRulesJson,
        String positionsJson
) {
}
