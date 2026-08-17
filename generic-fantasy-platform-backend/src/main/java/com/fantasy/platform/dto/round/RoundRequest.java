package com.fantasy.platform.dto.round;

import com.fantasy.platform.entity.RoundStatus;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record RoundRequest(
        @NotNull Integer roundNumber,
        @NotNull Long fantasyGameId,
        LocalDate startDate,
        LocalDate endDate,
        LocalDateTime transferDeadline,
        @NotNull RoundStatus status
) {
}
