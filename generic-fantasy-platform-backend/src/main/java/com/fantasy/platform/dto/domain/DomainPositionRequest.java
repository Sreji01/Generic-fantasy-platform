package com.fantasy.platform.dto.domain;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record DomainPositionRequest(
        @NotBlank String name,
        @Valid List<PositionSlotRequest> slots
) {
}
