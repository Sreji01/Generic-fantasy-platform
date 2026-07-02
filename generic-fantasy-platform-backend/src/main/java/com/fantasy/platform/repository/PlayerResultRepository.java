package com.fantasy.platform.repository;

import com.fantasy.platform.entity.PlayerResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlayerResultRepository extends JpaRepository<PlayerResult, Long> {

    List<PlayerResult> findByPlayerId(Long playerId);

    List<PlayerResult> findByRoundId(Long roundId);
}
