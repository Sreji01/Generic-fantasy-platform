package com.fantasy.platform.service;

import com.fantasy.platform.dto.league.LeagueRequest;
import com.fantasy.platform.dto.league.LeagueResponse;
import com.fantasy.platform.entity.FantasyGame;
import com.fantasy.platform.entity.FantasyTeam;
import com.fantasy.platform.entity.League;
import com.fantasy.platform.entity.User;
import com.fantasy.platform.entity.UserRole;
import com.fantasy.platform.repository.FantasyGameRepository;
import com.fantasy.platform.repository.FantasyTeamRepository;
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
    private final FantasyGameRepository fantasyGameRepository;
    private final FantasyTeamRepository fantasyTeamRepository;
    private final UserRepository userRepository;

    public LeagueResponse create(LeagueRequest request) {
        FantasyGame fantasyGame = findFantasyGameOrThrow(request.fantasyGameId());

        League league = new League();
        applyRequest(league, request, fantasyGame);

        leagueRepository.save(league);
        return toResponse(league);
    }

    public List<LeagueResponse> getAll() {
        return leagueRepository.findAll().stream().map(this::toResponse).toList();
    }

    public List<LeagueResponse> getByFantasyGame(Long fantasyGameId) {
        return leagueRepository.findByFantasyGameId(fantasyGameId).stream().map(this::toResponse).toList();
    }

    public LeagueResponse getById(Long id) {
        return toResponse(findLeagueOrThrow(id));
    }

    public LeagueResponse update(Long id, LeagueRequest request, Long userId) {
        League league = findLeagueOrThrow(id);
        requireAdmin(userId);

        FantasyGame fantasyGame = findFantasyGameOrThrow(request.fantasyGameId());
        applyRequest(league, request, fantasyGame);

        leagueRepository.save(league);
        return toResponse(league);
    }

    public void delete(Long id, Long userId) {
        League league = findLeagueOrThrow(id);
        requireAdmin(userId);

        List<FantasyTeam> teams = fantasyTeamRepository.findByLeaguesId(id);
        for (FantasyTeam team : teams) {
            team.getLeagues().removeIf(l -> l.getId().equals(id));
            fantasyTeamRepository.save(team);
        }

        leagueRepository.delete(league);
    }

    private void applyRequest(League league, LeagueRequest request, FantasyGame fantasyGame) {
        league.setName(request.name());
        league.setDescription(request.description());
        league.setFantasyGame(fantasyGame);
        league.setStartDate(request.startDate());
        league.setEndDate(request.endDate());
        league.setStatus(request.status());
        league.setMaxPlayersPerTeam(request.maxPlayersPerTeam());
        league.setIsPublic(request.isPublic() != null ? request.isPublic() : true);
    }

    private League findLeagueOrThrow(Long id) {
        return leagueRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "League not found"));
    }

    private FantasyGame findFantasyGameOrThrow(Long id) {
        return fantasyGameRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "FantasyGame not found"));
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
                league.getFantasyGame().getId(),
                league.getFantasyGame().getName(),
                league.getStartDate(),
                league.getEndDate(),
                league.getStatus(),
                league.getMaxPlayersPerTeam(),
                league.getFantasyTeams().size(),
                league.getIsPublic()
        );
    }
}
