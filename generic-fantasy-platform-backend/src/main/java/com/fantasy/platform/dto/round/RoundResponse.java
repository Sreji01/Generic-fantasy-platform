package com.fantasy.platform.dto.round;

import com.fantasy.platform.entity.RoundStatus;

import java.time.LocalDate;

public record RoundResponse(
        Long id,
        String name,
        Integer roundNumber,
        Long fantasyGameId,
        String fantasyGameName,
        LocalDate startDate,
        LocalDate endDate,
        RoundStatus status
) {
}
