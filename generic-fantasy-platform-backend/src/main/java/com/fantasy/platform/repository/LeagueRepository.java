package com.fantasy.platform.repository;

import com.fantasy.platform.entity.League;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LeagueRepository extends JpaRepository<League, Long> {

    List<League> findByDomainId(Long domainId);
}
