package com.fantasy.platform.dto.score;

import jakarta.validation.constraints.NotNull;

public record ScoreRequest(
        @NotNull Long fantasyTeamId,
        @NotNull Long roundId,
        Double points,
        String pointsBreakdownJson
) {
}
