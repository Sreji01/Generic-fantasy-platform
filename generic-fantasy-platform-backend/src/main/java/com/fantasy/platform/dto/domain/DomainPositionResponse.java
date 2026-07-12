package com.fantasy.platform.dto.domain;

public record DomainPositionResponse(
        Long id,
        String name,
        Integer playerCount,
        Double xPosition,
        Double yPosition
) {
}
