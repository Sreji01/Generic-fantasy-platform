package com.fantasy.platform.service;

import com.fantasy.platform.dto.league.LeagueRequest;
import com.fantasy.platform.dto.league.LeagueResponse;
import com.fantasy.platform.entity.Domain;
import com.fantasy.platform.entity.League;
import com.fantasy.platform.entity.User;
import com.fantasy.platform.entity.UserRole;
import com.fantasy.platform.repository.DomainRepository;
import com.fantasy.platform.repository.LeagueRepository;
import com.fantasy.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LeagueService {

    private final LeagueRepository leagueRepository;
    private final DomainRepository domainRepository;
    private final UserRepository userRepository;

    public LeagueResponse create(LeagueRequest request) {
        Domain domain = findDomainOrThrow(request.domainId());

        League league = new League();
        applyRequest(league, request, domain);

        leagueRepository.save(league);
        return toResponse(league);
    }

    public List<LeagueResponse> getAll() {
        return leagueRepository.findAll().stream().map(this::toResponse).toList();
    }

    public List<LeagueResponse> getByDomain(Long domainId) {
        return leagueRepository.findByDomainId(domainId).stream().map(this::toResponse).toList();
    }

    public LeagueResponse getById(Long id) {
        return toResponse(findLeagueOrThrow(id));
    }

    public LeagueResponse update(Long id, LeagueRequest request, Long userId) {
        League league = findLeagueOrThrow(id);
        requireAdmin(userId);

        Domain domain = findDomainOrThrow(request.domainId());
        applyRequest(league, request, domain);

        leagueRepository.save(league);
        return toResponse(league);
    }

    public void delete(Long id, Long userId) {
        League league = findLeagueOrThrow(id);
        requireAdmin(userId);
        leagueRepository.delete(league);
    }

    private void applyRequest(League league, LeagueRequest request, Domain domain) {
        league.setName(request.name());
        league.setDescription(request.description());
        league.setDomain(domain);
        league.setStartDate(request.startDate());
        league.setEndDate(request.endDate());
        league.setStatus(request.status());
        league.setMaxPlayersPerTeam(request.maxPlayersPerTeam());
        league.setBudget(request.budget());
    }

    private League findLeagueOrThrow(Long id) {
        return leagueRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "League not found"));
    }

    private Domain findDomainOrThrow(Long id) {
        return domainRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Domain not found"));
    }

    private void requireAdmin(Long userId) {
        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        if (currentUser.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Only an admin can modify leagues");
        }
    }

    private LeagueResponse toResponse(League league) {
        return new LeagueResponse(
                league.getId(),
                league.getName(),
                league.getDescription(),
                league.getDomain().getId(),
                league.getDomain().getName(),
                league.getStartDate(),
                league.getEndDate(),
                league.getStatus(),
                league.getMaxPlayersPerTeam(),
                league.getBudget(),
                league.getFantasyTeams().size()
        );
    }
}
