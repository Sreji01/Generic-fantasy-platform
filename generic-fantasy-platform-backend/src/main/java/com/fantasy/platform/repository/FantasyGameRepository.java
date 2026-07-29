package com.fantasy.platform.repository;

import com.fantasy.platform.entity.FantasyGame;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FantasyGameRepository extends JpaRepository<FantasyGame, Long> {
}
