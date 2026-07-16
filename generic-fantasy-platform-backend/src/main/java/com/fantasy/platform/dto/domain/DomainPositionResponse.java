package com.fantasy.platform.dto.domain;

import java.util.List;

public record DomainPositionResponse(
        Long id,
        String name,
        List<PositionSlotResponse> slots
) {
}
