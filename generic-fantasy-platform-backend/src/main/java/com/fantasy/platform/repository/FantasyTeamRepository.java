package com.fantasy.platform.repository;

import com.fantasy.platform.entity.FantasyTeam;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FantasyTeamRepository extends JpaRepository<FantasyTeam, Long> {

    List<FantasyTeam> findByUserId(Long userId);

    List<FantasyTeam> findByFantasyGameId(Long fantasyGameId);

    List<FantasyTeam> findByUserIdAndFantasyGameId(Long userId, Long fantasyGameId);

    List<FantasyTeam> findByLeaguesId(Long leagueId);

    long countByUserIdAndFantasyGameId(Long userId, Long fantasyGameId);
}
