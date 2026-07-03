package com.fantasy.platform.dto.league;

import com.fantasy.platform.entity.LeagueStatus;

import java.math.BigDecimal;
import java.time.LocalDate;

public record LeagueResponse(
        Long id,
        String name,
        String description,
        Long domainId,
        String domainName,
        LocalDate startDate,
        LocalDate endDate,
        LeagueStatus status,
        Integer maxPlayersPerTeam,
        BigDecimal budget
) {
}
