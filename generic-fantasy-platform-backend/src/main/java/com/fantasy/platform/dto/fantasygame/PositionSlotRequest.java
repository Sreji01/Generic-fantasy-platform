package com.fantasy.platform.dto.domain;

import jakarta.validation.constraints.NotNull;

public record PositionSlotRequest(
        @NotNull Integer rowIndex,
        @NotNull Integer colIndex
) {
}
