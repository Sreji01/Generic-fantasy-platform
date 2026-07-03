package com.fantasy.platform.dto.domain;

public record DomainResponse(
        Long id,
        String name,
        String description,
        String scoringRulesJson,
        String positionsJson,
        Long createdById,
        String createdByUsername
) {
}
