package com.fantasy.platform.dto.round;

import com.fantasy.platform.entity.RoundStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record RoundRequest(
        @NotBlank String name,
        @NotNull Integer roundNumber,
        @NotNull Long fantasyGameId,
        LocalDate startDate,
        LocalDate endDate,
        @NotNull RoundStatus status
) {
}
