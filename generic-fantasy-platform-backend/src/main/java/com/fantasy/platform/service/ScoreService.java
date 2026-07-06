package com.fantasy.platform.service;

import com.fantasy.platform.dto.score.ScoreRequest;
import com.fantasy.platform.dto.score.ScoreResponse;
import com.fantasy.platform.entity.FantasyTeam;
import com.fantasy.platform.entity.Round;
import com.fantasy.platform.entity.Score;
import com.fantasy.platform.entity.User;
import com.fantasy.platform.entity.UserRole;
import com.fantasy.platform.repository.FantasyTeamRepository;
import com.fantasy.platform.repository.RoundRepository;
import com.fantasy.platform.repository.ScoreRepository;
import com.fantasy.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ScoreService {

    private final ScoreRepository scoreRepository;
    private final FantasyTeamRepository fantasyTeamRepository;
    private final RoundRepository roundRepository;
    private final UserRepository userRepository;

    public ScoreResponse create(ScoreRequest request, Long userId) {
        FantasyTeam team = findTeamOrThrow(request.fantasyTeamId());
        Round round = findRoundOrThrow(request.roundId());
        requireDomainOwnerOrAdmin(team, userId);
        requireSameDomain(team, round);

        Score score = new Score();
        applyRequest(score, request, team, round);

        scoreRepository.save(score);
        return toResponse(score);
    }

    public List<ScoreResponse> getAll() {
        return scoreRepository.findAll().stream().map(this::toResponse).toList();
    }

    public List<ScoreResponse> getByFantasyTeam(Long fantasyTeamId) {
        return scoreRepository.findByFantasyTeamId(fantasyTeamId).stream().map(this::toResponse).toList();
    }

    public List<ScoreResponse> getByRound(Long roundId) {
        return scoreRepository.findByRoundId(roundId).stream().map(this::toResponse).toList();
    }

    public ScoreResponse getById(Long id) {
        return toResponse(findScoreOrThrow(id));
    }

    public ScoreResponse update(Long id, ScoreRequest request, Long userId) {
        Score score = findScoreOrThrow(id);
        FantasyTeam team = findTeamOrThrow(request.fantasyTeamId());
        Round round = findRoundOrThrow(request.roundId());
        requireDomainOwnerOrAdmin(team, userId);
        requireSameDomain(team, round);

        applyRequest(score, request, team, round);

        scoreRepository.save(score);
        return toResponse(score);
    }

    public void delete(Long id, Long userId) {
        Score score = findScoreOrThrow(id);
        requireDomainOwnerOrAdmin(score.getFantasyTeam(), userId);
        scoreRepository.delete(score);
    }

    private void applyRequest(Score score, ScoreRequest request, FantasyTeam team, Round round) {
        score.setFantasyTeam(team);
        score.setRound(round);
        score.setPoints(request.points());
        score.setPointsBreakdownJson(request.pointsBreakdownJson());
    }

    private Score findScoreOrThrow(Long id) {
        return scoreRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Score not found"));
    }

    private FantasyTeam findTeamOrThrow(Long id) {
        return fantasyTeamRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Fantasy team not found"));
    }

    private Round findRoundOrThrow(Long id) {
        return roundRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Round not found"));
    }

    private void requireDomainOwnerOrAdmin(FantasyTeam team, Long userId) {
        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        boolean isOwner = team.getLeague().getDomain().getCreatedBy().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == UserRole.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new AccessDeniedException("Only the domain owner or an admin can manage scores");
        }
    }

    private void requireSameDomain(FantasyTeam team, Round round) {
        if (!team.getLeague().getDomain().getId().equals(round.getDomain().getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fantasy team and round must belong to the same domain");
        }
    }

    private ScoreResponse toResponse(Score score) {
        return new ScoreResponse(
                score.getId(),
                score.getFantasyTeam().getId(),
                score.getFantasyTeam().getName(),
                score.getRound().getId(),
                score.getPoints(),
                score.getPointsBreakdownJson()
        );
    }
}
