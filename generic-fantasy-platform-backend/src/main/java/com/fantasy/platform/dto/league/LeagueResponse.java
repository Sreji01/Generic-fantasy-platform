package com.fantasy.platform.dto.league;

import com.fantasy.platform.entity.LeagueStatus;

import java.time.LocalDate;

public record LeagueResponse(
        Long id,
        String name,
        String description,
        Long fantasyGameId,
        String fantasyGameName,
        LocalDate startDate,
        LocalDate endDate,
        LeagueStatus status,
        Integer maxPlayersPerTeam,
        Integer participantCount,
        Boolean isPublic,
        String joinCode
) {
}
