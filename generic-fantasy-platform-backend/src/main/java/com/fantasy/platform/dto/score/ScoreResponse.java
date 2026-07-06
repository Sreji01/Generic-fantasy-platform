package com.fantasy.platform.dto.score;

public record ScoreResponse(
        Long id,
        Long fantasyTeamId,
        String fantasyTeamName,
        Long roundId,
        Double points,
        String pointsBreakdownJson
) {
}
