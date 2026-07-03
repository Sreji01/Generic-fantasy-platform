package com.fantasy.platform.dto.fantasyteam;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record FantasyTeamRequest(
        @NotBlank String name,
        @NotNull Long leagueId,
        @NotEmpty List<Long> playerIds
) {
}
