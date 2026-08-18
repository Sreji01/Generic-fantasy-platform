package com.fantasy.platform.service;

import com.fantasy.platform.dto.fantasyteam.FantasyTeamRequest;
import com.fantasy.platform.dto.fantasyteam.FantasyTeamResponse;
import com.fantasy.platform.dto.fantasyteam.StandingEntry;
import com.fantasy.platform.dto.fantasyteam.TeamLeagueSummary;
import com.fantasy.platform.entity.FantasyGame;
import com.fantasy.platform.entity.FantasyTeam;
import com.fantasy.platform.entity.League;
import com.fantasy.platform.entity.Player;
import com.fantasy.platform.entity.RoundStatus;
import com.fantasy.platform.entity.User;
import com.fantasy.platform.entity.UserRole;
import com.fantasy.platform.repository.FantasyGameRepository;
import com.fantasy.platform.repository.FantasyTeamRepository;
import com.fantasy.platform.repository.LeagueRepository;
import com.fantasy.platform.repository.PlayerRepository;
import com.fantasy.platform.repository.RoundRepository;
import com.fantasy.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FantasyTeamService {

    private static final int MAX_TEAMS_PER_FANTASY_GAME = 3;

    private final FantasyTeamRepository fantasyTeamRepository;
    private final FantasyGameRepository fantasyGameRepository;
    private final LeagueRepository leagueRepository;
    private final PlayerRepository playerRepository;
    private final RoundRepository roundRepository;
    private final UserRepository userRepository;

    public FantasyTeamResponse create(FantasyTeamRequest request, Long userId) {
        User user = findUserOrThrow(userId);
        FantasyGame fantasyGame = findFantasyGameOrThrow(request.fantasyGameId());

        if (fantasyTeamRepository.countByUserIdAndFantasyGameId(userId, fantasyGame.getId()) >= MAX_TEAMS_PER_FANTASY_GAME) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "You already have the maximum of " + MAX_TEAMS_PER_FANTASY_GAME + " teams in this fantasy game");
        }
        requireTransfersUnlocked(fantasyGame, user);

        List<Player> players = resolvePlayers(request.playerIds(), fantasyGame);

        FantasyTeam team = new FantasyTeam();
        team.setUser(user);
        team.setCreatedAt(LocalDateTime.now());
        applyRequest(team, request, fantasyGame, players);

        fantasyTeamRepository.save(team);
        return toResponse(team);
    }

    public List<FantasyTeamResponse> getAll() {
        return fantasyTeamRepository.findAll().stream().map(this::toResponse).toList();
    }

    public List<FantasyTeamResponse> getByLeague(Long leagueId) {
        return fantasyTeamRepository.findByLeaguesId(leagueId).stream().map(this::toResponse).toList();
    }

    public List<FantasyTeamResponse> getByFantasyGame(Long fantasyGameId) {
        return fantasyTeamRepository.findByFantasyGameId(fantasyGameId).stream().map(this::toResponse).toList();
    }

    public List<FantasyTeamResponse> getByUser(Long userId, Long fantasyGameId) {
        List<FantasyTeam> teams = fantasyGameId != null
                ? fantasyTeamRepository.findByUserIdAndFantasyGameId(userId, fantasyGameId)
                : fantasyTeamRepository.findByUserId(userId);
        return teams.stream().map(this::toResponse).toList();
    }

    public List<StandingEntry> getStandingsByLeague(Long leagueId, Long userId) {
        League league = leagueRepository.findById(leagueId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "League not found"));

        if (!league.getIsPublic()) {
            User user = findUserOrThrow(userId);
            boolean isMember = fantasyTeamRepository.existsByUserIdAndLeaguesId(userId, leagueId);
            if (!isMember && user.getRole() != UserRole.ADMIN) {
                throw new AccessDeniedException("Join this league to view its standings");
            }
        }

        List<FantasyTeam> teams = fantasyTeamRepository.findByLeaguesId(leagueId);
        teams.sort(Comparator.comparing(FantasyTeam::getTotalPoints, Comparator.nullsFirst(Comparator.naturalOrder())).reversed());

        List<StandingEntry> standings = new ArrayList<>();
        for (int i = 0; i < teams.size(); i++) {
            FantasyTeam team = teams.get(i);
            standings.add(new StandingEntry(
                    i + 1,
                    team.getId(),
                    team.getName(),
                    team.getUser().getId(),
                    team.getUser().getUsername(),
                    team.getTotalPoints()
            ));
        }
        return standings;
    }

    public FantasyTeamResponse getById(Long id) {
        return toResponse(findTeamOrThrow(id));
    }

    /**
     * Roster edits are always allowed: a saved lineup only takes effect starting with the
     * next round, so there is nothing to protect by locking it while a round is active.
     */
    public FantasyTeamResponse update(Long id, FantasyTeamRequest request, Long userId) {
        FantasyTeam team = findTeamOrThrow(id);
        requireOwnerOrAdmin(team, userId);

        FantasyGame fantasyGame = team.getFantasyGame();
        List<Player> players = resolvePlayers(request.playerIds(), fantasyGame);
        applyRequest(team, request, fantasyGame, players);

        fantasyTeamRepository.save(team);
        return toResponse(team);
    }

    public void delete(Long id, Long userId) {
        FantasyTeam team = findTeamOrThrow(id);
        requireOwnerOrAdmin(team, userId);
        fantasyTeamRepository.delete(team);
    }

    public FantasyTeamResponse joinLeague(Long teamId, Long leagueId, String joinCode, Long userId) {
        FantasyTeam team = findTeamOrThrow(teamId);
        User currentUser = requireOwnerOrAdmin(team, userId);
        League league = findLeagueOrThrow(leagueId);

        if (!league.getFantasyGame().getId().equals(team.getFantasyGame().getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "League does not belong to this team's fantasy game");
        }
        if (!league.getIsPublic() && !league.getJoinCode().equalsIgnoreCase(trim(joinCode))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Invalid join code");
        }
        requireTransfersUnlocked(team.getFantasyGame(), currentUser);

        boolean alreadyInLeague = team.getLeagues().stream().anyMatch(l -> l.getId().equals(leagueId));
        if (alreadyInLeague) {
            return toResponse(team);
        }

        boolean userHasOtherTeamInLeague = fantasyTeamRepository.findByLeaguesId(leagueId).stream()
                .anyMatch(t -> t.getUser().getId().equals(currentUser.getId()));
        if (userHasOtherTeamInLeague) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already have a team in this league");
        }

        team.getLeagues().add(league);
        fantasyTeamRepository.save(team);
        return toResponse(team);
    }

    public FantasyTeamResponse leaveLeague(Long teamId, Long leagueId, Long userId) {
        FantasyTeam team = findTeamOrThrow(teamId);
        requireOwnerOrAdmin(team, userId);

        team.getLeagues().removeIf(l -> l.getId().equals(leagueId));
        fantasyTeamRepository.save(team);
        return toResponse(team);
    }

    private void applyRequest(FantasyTeam team, FantasyTeamRequest request, FantasyGame fantasyGame, List<Player> players) {
        team.setName(request.name());
        team.setFantasyGame(fantasyGame);
        team.setPlayers(players);
    }

    private List<Player> resolvePlayers(List<Long> playerIds, FantasyGame fantasyGame) {
        List<Player> players = playerRepository.findAllById(playerIds);
        if (players.size() != playerIds.size()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "One or more players not found");
        }

        boolean allInFantasyGame = players.stream()
                .allMatch(p -> p.getFantasyGame().getId().equals(fantasyGame.getId()));
        if (!allInFantasyGame) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "All players must belong to the fantasy game");
        }

        Double budget = fantasyGame.getBudget();
        if (budget != null) {
            BigDecimal totalCost = players.stream()
                    .map(Player::getPrice)
                    .filter(price -> price != null)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            if (totalCost.compareTo(BigDecimal.valueOf(budget)) > 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Team exceeds the fantasy game budget");
            }
        }

        return players;
    }

    private static String trim(String value) {
        return value != null ? value.trim() : "";
    }

    private FantasyTeam findTeamOrThrow(Long id) {
        return fantasyTeamRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Fantasy team not found"));
    }

    private League findLeagueOrThrow(Long id) {
        return leagueRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "League not found"));
    }

    private FantasyGame findFantasyGameOrThrow(Long id) {
        return fantasyGameRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "FantasyGame not found"));
    }

    private User findUserOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    private User requireOwnerOrAdmin(FantasyTeam team, Long userId) {
        User currentUser = findUserOrThrow(userId);

        boolean isOwner = team.getUser().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == UserRole.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new AccessDeniedException("Only the team owner or an admin can manage this fantasy team");
        }
        return currentUser;
    }

    private void requireTransfersUnlocked(FantasyGame fantasyGame, User currentUser) {
        if (currentUser.getRole() == UserRole.ADMIN) {
            return;
        }
        boolean hasActiveRound = roundRepository.existsByFantasyGameIdAndStatus(fantasyGame.getId(), RoundStatus.ACTIVE);
        if (hasActiveRound) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Team changes are locked while a round is active");
        }

        LocalDateTime now = LocalDateTime.now();
        boolean pastTransferDeadline = roundRepository.findByFantasyGameId(fantasyGame.getId()).stream()
                .anyMatch(round -> round.getStatus() != RoundStatus.FINISHED
                        && round.getTransferDeadline() != null
                        && !now.isBefore(round.getTransferDeadline()));
        if (pastTransferDeadline) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Team changes are locked past the transfer deadline");
        }
    }

    private FantasyTeamResponse toResponse(FantasyTeam team) {
        List<TeamLeagueSummary> leagues = team.getLeagues().stream()
                .map(l -> new TeamLeagueSummary(l.getId(), l.getName()))
                .toList();

        return new FantasyTeamResponse(
                team.getId(),
                team.getName(),
                team.getUser().getId(),
                team.getUser().getUsername(),
                team.getFantasyGame().getId(),
                team.getFantasyGame().getName(),
                team.getTotalPoints(),
                team.getCreatedAt(),
                team.getPlayers().stream().map(Player::getId).toList(),
                leagues
        );
    }
}
