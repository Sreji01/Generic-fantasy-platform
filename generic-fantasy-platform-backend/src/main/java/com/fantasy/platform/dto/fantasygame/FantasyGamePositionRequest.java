package com.fantasy.platform.dto.fantasygame;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record FantasyGamePositionRequest(
        @NotBlank String name,
        @Valid List<PositionSlotRequest> slots
) {
}
