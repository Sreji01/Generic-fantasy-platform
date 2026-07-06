package com.fantasy.platform.dto.fantasyteam;

public record StandingEntry(
        int rank,
        Long fantasyTeamId,
        String fantasyTeamName,
        Long userId,
        String username,
        Double totalPoints
) {
}
