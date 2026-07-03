package com.fantasy.platform.dto.player;

import java.math.BigDecimal;

public record PlayerResponse(
        Long id,
        String firstName,
        String lastName,
        String position,
        String realTeam,
        BigDecimal price,
        String imageUrl,
        Long domainId
) {
}
