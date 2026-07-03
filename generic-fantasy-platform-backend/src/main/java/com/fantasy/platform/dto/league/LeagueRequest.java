package com.fantasy.platform.dto.league;

import com.fantasy.platform.entity.LeagueStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record LeagueRequest(
        @NotBlank String name,
        String description,
        @NotNull Long domainId,
        LocalDate startDate,
        LocalDate endDate,
        @NotNull LeagueStatus status,
        Integer maxPlayersPerTeam,
        BigDecimal budget
) {
}
