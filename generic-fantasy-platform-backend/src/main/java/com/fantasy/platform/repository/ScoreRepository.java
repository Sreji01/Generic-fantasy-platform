package com.fantasy.platform.repository;

import com.fantasy.platform.entity.Score;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ScoreRepository extends JpaRepository<Score, Long> {

    List<Score> findByFantasyTeamId(Long fantasyTeamId);

    List<Score> findByRoundId(Long roundId);
}
