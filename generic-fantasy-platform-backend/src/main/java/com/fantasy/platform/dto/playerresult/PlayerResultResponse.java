package com.fantasy.platform.dto.playerresult;

public record PlayerResultResponse(
        Long id,
        Long playerId,
        String playerName,
        Long roundId,
        String resultsJson,
        Double pointsEarned
) {
}
