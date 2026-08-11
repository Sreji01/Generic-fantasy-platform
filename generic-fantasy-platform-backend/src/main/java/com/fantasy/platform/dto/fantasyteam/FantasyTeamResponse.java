package com.fantasy.platform.dto.fantasyteam;

import java.time.LocalDateTime;
import java.util.List;

public record FantasyTeamResponse(
        Long id,
        String name,
        Long userId,
        String username,
        Long fantasyGameId,
        String fantasyGameName,
        Double totalPoints,
        LocalDateTime createdAt,
        List<Long> playerIds,
        List<TeamLeagueSummary> leagues
) {
}
