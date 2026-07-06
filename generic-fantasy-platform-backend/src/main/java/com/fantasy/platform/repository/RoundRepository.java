package com.fantasy.platform.repository;

import com.fantasy.platform.entity.Round;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoundRepository extends JpaRepository<Round, Long> {

    List<Round> findByDomainId(Long domainId);
}
