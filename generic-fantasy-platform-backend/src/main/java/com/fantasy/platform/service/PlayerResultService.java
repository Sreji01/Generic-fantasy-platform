package com.fantasy.platform.service;

import com.fantasy.platform.dto.playerresult.PlayerResultRequest;
import com.fantasy.platform.dto.playerresult.PlayerResultResponse;
import com.fantasy.platform.entity.FantasyGame;
import com.fantasy.platform.entity.Player;
import com.fantasy.platform.entity.PlayerResult;
import com.fantasy.platform.entity.Round;
import com.fantasy.platform.entity.ScoringRule;
import com.fantasy.platform.entity.ScoringRulePositionValue;
import com.fantasy.platform.entity.User;
import com.fantasy.platform.entity.UserRole;
import com.fantasy.platform.repository.PlayerRepository;
import com.fantasy.platform.repository.PlayerResultRepository;
import com.fantasy.platform.repository.RoundRepository;
import com.fantasy.platform.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlayerResultService {

    private final PlayerResultRepository playerResultRepository;
    private final PlayerRepository playerRepository;
    private final RoundRepository roundRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public PlayerResultResponse create(PlayerResultRequest request, Long userId) {
        Player player = findPlayerOrThrow(request.playerId());
        Round round = findRoundOrThrow(request.roundId());
        requireFantasyGameOwnerOrAdmin(round, userId);
        requireSameFantasyGame(player, round);

        PlayerResult result = new PlayerResult();
        applyRequest(result, request, player, round);

        playerResultRepository.save(result);
        return toResponse(result);
    }

    public List<PlayerResultResponse> getAll() {
        return playerResultRepository.findAll().stream().map(this::toResponse).toList();
    }

    public List<PlayerResultResponse> getByPlayer(Long playerId) {
        return playerResultRepository.findByPlayerId(playerId).stream().map(this::toResponse).toList();
    }

    public List<PlayerResultResponse> getByRound(Long roundId) {
        return playerResultRepository.findByRoundId(roundId).stream().map(this::toResponse).toList();
    }

    public PlayerResultResponse getById(Long id) {
        return toResponse(findResultOrThrow(id));
    }

    public PlayerResultResponse update(Long id, PlayerResultRequest request, Long userId) {
        PlayerResult result = findResultOrThrow(id);
        Player player = findPlayerOrThrow(request.playerId());
        Round round = findRoundOrThrow(request.roundId());
        requireFantasyGameOwnerOrAdmin(round, userId);
        requireSameFantasyGame(player, round);

        applyRequest(result, request, player, round);

        playerResultRepository.save(result);
        return toResponse(result);
    }

    public void delete(Long id, Long userId) {
        PlayerResult result = findResultOrThrow(id);
        requireFantasyGameOwnerOrAdmin(result.getRound(), userId);
        playerResultRepository.delete(result);
    }

    private void applyRequest(PlayerResult result, PlayerResultRequest request, Player player, Round round) {
        result.setPlayer(player);
        result.setRound(round);
        result.setResultsJson(request.resultsJson());
        result.setPointsEarned(computePointsEarned(round.getFantasyGame(), player, request));
    }

    private Double computePointsEarned(FantasyGame fantasyGame, Player player, PlayerResultRequest request) {
        if (request.resultsJson() == null || request.resultsJson().isBlank()) {
            return request.pointsEarned();
        }

        Map<String, ScoringRule> rules = fantasyGame.getScoringRules().stream()
                .collect(Collectors.toMap(ScoringRule::getName, r -> r, (a, b) -> b));
        Map<String, Double> stats = parseStatsJson(request.resultsJson());

        double total = 0;
        for (Map.Entry<String, Double> stat : stats.entrySet()) {
            ScoringRule rule = rules.get(stat.getKey());
            if (rule == null) {
                continue;
            }
            total += stat.getValue() * resolvePoints(rule, player.getPosition());
        }
        return total;
    }

    private double resolvePoints(ScoringRule rule, String playerPosition) {
        if (!Boolean.TRUE.equals(rule.getVariesByPosition())) {
            return rule.getPoints() != null ? rule.getPoints() : 0.0;
        }
        return rule.getPositionValues().stream()
                .filter(v -> v.getPositionName().equals(playerPosition))
                .map(ScoringRulePositionValue::getPoints)
                .findFirst()
                .orElse(0.0);
    }

    private Map<String, Double> parseStatsJson(String json) {
        if (json == null || json.isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Double>>() {
            });
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid JSON format: " + json);
        }
    }

    private PlayerResult findResultOrThrow(Long id) {
        return playerResultRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Player result not found"));
    }

    private Player findPlayerOrThrow(Long id) {
        return playerRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Player not found"));
    }

    private Round findRoundOrThrow(Long id) {
        return roundRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Round not found"));
    }

    private void requireFantasyGameOwnerOrAdmin(Round round, Long userId) {
        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        boolean isOwner = round.getFantasyGame().getCreatedBy().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == UserRole.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new AccessDeniedException("Only the fantasyGame owner or an admin can enter player results");
        }
    }

    private void requireSameFantasyGame(Player player, Round round) {
        if (!player.getFantasyGame().getId().equals(round.getFantasyGame().getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Player and round must belong to the same fantasyGame");
        }
    }

    private PlayerResultResponse toResponse(PlayerResult result) {
        return new PlayerResultResponse(
                result.getId(),
                result.getPlayer().getId(),
                result.getPlayer().getFirstName() + " " + result.getPlayer().getLastName(),
                result.getRound().getId(),
                result.getResultsJson(),
                result.getPointsEarned()
        );
    }
}
