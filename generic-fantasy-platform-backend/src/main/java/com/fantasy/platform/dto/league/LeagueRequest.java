package com.fantasy.platform.dto.league;

import com.fantasy.platform.entity.LeagueStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record LeagueRequest(
        @NotBlank String name,
        String description,
        @NotNull Long fantasyGameId,
        LocalDate startDate,
        LocalDate endDate,
        @NotNull LeagueStatus status,
        Boolean isPublic
) {
}
