package com.fantasy.platform.repository;

import com.fantasy.platform.entity.Player;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlayerRepository extends JpaRepository<Player, Long> {

    List<Player> findByDomainId(Long domainId);
}
