package com.fantasy.platform.service;

import com.fantasy.platform.dto.fantasyteam.FantasyTeamRequest;
import com.fantasy.platform.dto.fantasyteam.FantasyTeamResponse;
import com.fantasy.platform.entity.FantasyTeam;
import com.fantasy.platform.entity.League;
import com.fantasy.platform.entity.Player;
import com.fantasy.platform.entity.User;
import com.fantasy.platform.entity.UserRole;
import com.fantasy.platform.repository.FantasyTeamRepository;
import com.fantasy.platform.repository.LeagueRepository;
import com.fantasy.platform.repository.PlayerRepository;
import com.fantasy.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FantasyTeamService {

    private final FantasyTeamRepository fantasyTeamRepository;
    private final LeagueRepository leagueRepository;
    private final PlayerRepository playerRepository;
    private final UserRepository userRepository;

    public FantasyTeamResponse create(FantasyTeamRequest request, Long userId) {
        User user = findUserOrThrow(userId);
        League league = findLeagueOrThrow(request.leagueId());
        List<Player> players = resolvePlayers(request.playerIds(), league);

        FantasyTeam team = new FantasyTeam();
        team.setUser(user);
        team.setCreatedAt(LocalDateTime.now());
        applyRequest(team, request, league, players);

        fantasyTeamRepository.save(team);
        return toResponse(team);
    }

    public List<FantasyTeamResponse> getAll() {
        return fantasyTeamRepository.findAll().stream().map(this::toResponse).toList();
    }

    public List<FantasyTeamResponse> getByLeague(Long leagueId) {
        return fantasyTeamRepository.findByLeagueId(leagueId).stream().map(this::toResponse).toList();
    }

    public List<FantasyTeamResponse> getByUser(Long userId) {
        return fantasyTeamRepository.findByUserId(userId).stream().map(this::toResponse).toList();
    }

    public FantasyTeamResponse getById(Long id) {
        return toResponse(findTeamOrThrow(id));
    }

    public FantasyTeamResponse update(Long id, FantasyTeamRequest request, Long userId) {
        FantasyTeam team = findTeamOrThrow(id);
        requireOwnerOrAdmin(team, userId);

        League league = findLeagueOrThrow(request.leagueId());
        List<Player> players = resolvePlayers(request.playerIds(), league);
        applyRequest(team, request, league, players);

        fantasyTeamRepository.save(team);
        return toResponse(team);
    }

    public void delete(Long id, Long userId) {
        FantasyTeam team = findTeamOrThrow(id);
        requireOwnerOrAdmin(team, userId);
        fantasyTeamRepository.delete(team);
    }

    private void applyRequest(FantasyTeam team, FantasyTeamRequest request, League league, List<Player> players) {
        team.setName(request.name());
        team.setLeague(league);
        team.setPlayers(players);
    }

    private List<Player> resolvePlayers(List<Long> playerIds, League league) {
        List<Player> players = playerRepository.findAllById(playerIds);
        if (players.size() != playerIds.size()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "One or more players not found");
        }

        boolean allInDomain = players.stream()
                .allMatch(p -> p.getDomain().getId().equals(league.getDomain().getId()));
        if (!allInDomain) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "All players must belong to the league's domain");
        }

        if (league.getMaxPlayersPerTeam() != null && players.size() > league.getMaxPlayersPerTeam()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Team exceeds the maximum of " + league.getMaxPlayersPerTeam() + " players");
        }

        if (league.getBudget() != null) {
            BigDecimal totalCost = players.stream()
                    .map(Player::getPrice)
                    .filter(price -> price != null)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            if (totalCost.compareTo(league.getBudget()) > 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Team exceeds the league budget");
            }
        }

        return players;
    }

    private FantasyTeam findTeamOrThrow(Long id) {
        return fantasyTeamRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Fantasy team not found"));
    }

    private League findLeagueOrThrow(Long id) {
        return leagueRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "League not found"));
    }

    private User findUserOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    private void requireOwnerOrAdmin(FantasyTeam team, Long userId) {
        User currentUser = findUserOrThrow(userId);

        boolean isOwner = team.getUser().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == UserRole.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new AccessDeniedException("Only the team owner or an admin can manage this fantasy team");
        }
    }

    private FantasyTeamResponse toResponse(FantasyTeam team) {
        return new FantasyTeamResponse(
                team.getId(),
                team.getName(),
                team.getUser().getId(),
                team.getUser().getUsername(),
                team.getLeague().getId(),
                team.getLeague().getName(),
                team.getTotalPoints(),
                team.getCreatedAt(),
                team.getPlayers().stream().map(Player::getId).toList()
        );
    }
}
