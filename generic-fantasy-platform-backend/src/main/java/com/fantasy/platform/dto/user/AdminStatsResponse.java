package com.fantasy.platform.dto.user;

public record AdminStatsResponse(
        long userCount,
        long fantasyGameCount,
        long leagueCount,
        long playerCount
) {
}
