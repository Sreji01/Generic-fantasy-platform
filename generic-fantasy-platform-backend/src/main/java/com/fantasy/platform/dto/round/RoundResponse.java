package com.fantasy.platform.dto.round;

import com.fantasy.platform.entity.RoundStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record RoundResponse(
        Long id,
        Integer roundNumber,
        Long fantasyGameId,
        String fantasyGameName,
        LocalDate startDate,
        LocalDate endDate,
        LocalDateTime transferDeadline,
        RoundStatus status
) {
}
