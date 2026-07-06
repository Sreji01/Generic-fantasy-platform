package com.fantasy.platform.repository;

import com.fantasy.platform.entity.FantasyTeam;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FantasyTeamRepository extends JpaRepository<FantasyTeam, Long> {

    List<FantasyTeam> findByUserId(Long userId);

    List<FantasyTeam> findByLeagueId(Long leagueId);

    List<FantasyTeam> findByLeagueDomainId(Long domainId);
}
