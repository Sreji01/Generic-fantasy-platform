package com.fantasy.platform.dto.playerresult;

import jakarta.validation.constraints.NotNull;

public record PlayerResultRequest(
        @NotNull Long playerId,
        @NotNull Long roundId,
        String resultsJson,
        Double pointsEarned
) {
}
