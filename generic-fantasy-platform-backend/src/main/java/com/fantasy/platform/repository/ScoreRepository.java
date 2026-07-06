package com.fantasy.platform.repository;

import com.fantasy.platform.entity.Score;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ScoreRepository extends JpaRepository<Score, Long> {

    List<Score> findByFantasyTeamId(Long fantasyTeamId);

    List<Score> findByRoundId(Long roundId);

    Optional<Score> findByFantasyTeamIdAndRoundId(Long fantasyTeamId, Long roundId);
}
