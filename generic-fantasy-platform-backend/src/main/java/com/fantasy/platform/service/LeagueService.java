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

import java.security.SecureRandom;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LeagueService {

    private static final String JOIN_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int JOIN_CODE_LENGTH = 6;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final LeagueRepository leagueRepository;
    private final FantasyGameRepository fantasyGameRepository;
    private final FantasyTeamRepository fantasyTeamRepository;
    private final UserRepository userRepository;

    public LeagueResponse create(LeagueRequest request) {
        FantasyGame fantasyGame = findFantasyGameOrThrow(request.fantasyGameId());

        League league = new League();
        applyRequest(league, request, fantasyGame);

        leagueRepository.save(league);
        return toResponse(league, true);
    }

    public List<LeagueResponse> getAll() {
        return leagueRepository.findAll().stream().map(l -> toResponse(l, false)).toList();
    }

    public List<LeagueResponse> getByFantasyGame(Long fantasyGameId) {
        return leagueRepository.findByFantasyGameId(fantasyGameId).stream().map(l -> toResponse(l, false)).toList();
    }

    public LeagueResponse getById(Long id) {
        return toResponse(findLeagueOrThrow(id), false);
    }

    public LeagueResponse update(Long id, LeagueRequest request, Long userId) {
        League league = findLeagueOrThrow(id);
        requireAdmin(userId);

        FantasyGame fantasyGame = findFantasyGameOrThrow(request.fantasyGameId());
        applyRequest(league, request, fantasyGame);

        leagueRepository.save(league);
        return toResponse(league, true);
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
        validateDatesWithinFantasyGame(request, fantasyGame);

        league.setName(request.name());
        league.setDescription(request.description());
        league.setFantasyGame(fantasyGame);
        league.setStartDate(request.startDate());
        league.setEndDate(request.endDate());
        league.setStatus(request.status());
        league.setIsPublic(request.isPublic() != null ? request.isPublic() : true);

        if (!league.getIsPublic() && league.getJoinCode() == null) {
            league.setJoinCode(generateUniqueJoinCode());
        }
    }

    private void validateDatesWithinFantasyGame(LeagueRequest request, FantasyGame fantasyGame) {
        if (request.startDate() != null && fantasyGame.getStartDate() != null
                && request.startDate().isBefore(fantasyGame.getStartDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "League start date cannot be before the fantasy game's start date");
        }
        if (request.endDate() != null && fantasyGame.getEndDate() != null
                && request.endDate().isAfter(fantasyGame.getEndDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "League end date cannot be after the fantasy game's end date");
        }
        if (request.startDate() != null && fantasyGame.getEndDate() != null
                && request.startDate().isAfter(fantasyGame.getEndDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "League start date cannot be after the fantasy game's end date");
        }
        if (request.endDate() != null && fantasyGame.getStartDate() != null
                && request.endDate().isBefore(fantasyGame.getStartDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "League end date cannot be before the fantasy game's start date");
        }
    }

    private String generateUniqueJoinCode() {
        String code;
        do {
            StringBuilder sb = new StringBuilder(JOIN_CODE_LENGTH);
            for (int i = 0; i < JOIN_CODE_LENGTH; i++) {
                sb.append(JOIN_CODE_ALPHABET.charAt(RANDOM.nextInt(JOIN_CODE_ALPHABET.length())));
            }
            code = sb.toString();
        } while (leagueRepository.existsByJoinCode(code));
        return code;
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

    private LeagueResponse toResponse(League league, boolean includeJoinCode) {
        return new LeagueResponse(
                league.getId(),
                league.getName(),
                league.getDescription(),
                league.getFantasyGame().getId(),
                league.getFantasyGame().getName(),
                league.getStartDate(),
                league.getEndDate(),
                league.getStatus(),
                league.getFantasyTeams().size(),
                league.getIsPublic(),
                includeJoinCode ? league.getJoinCode() : null
        );
    }
}
