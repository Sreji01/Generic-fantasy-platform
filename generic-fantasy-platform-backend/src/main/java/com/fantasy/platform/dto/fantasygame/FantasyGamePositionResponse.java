package com.fantasy.platform.dto.fantasygame;

import java.util.List;

public record FantasyGamePositionResponse(
        Long id,
        String name,
        List<PositionSlotResponse> slots
) {
}
