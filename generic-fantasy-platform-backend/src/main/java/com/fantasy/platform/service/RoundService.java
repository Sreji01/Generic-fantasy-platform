package com.fantasy.platform.service;

import com.fantasy.platform.dto.round.RoundRequest;
import com.fantasy.platform.dto.round.RoundResponse;
import com.fantasy.platform.entity.FantasyGame;
import com.fantasy.platform.entity.Round;
import com.fantasy.platform.entity.User;
import com.fantasy.platform.entity.UserRole;
import com.fantasy.platform.repository.FantasyGameRepository;
import com.fantasy.platform.repository.RoundRepository;
import com.fantasy.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoundService {

    private final RoundRepository roundRepository;
    private final FantasyGameRepository fantasyGameRepository;
    private final UserRepository userRepository;

    public RoundResponse create(RoundRequest request, Long userId) {
        FantasyGame fantasyGame = findFantasyGameOrThrow(request.fantasyGameId());
        requireFantasyGameOwnerOrAdmin(fantasyGame, userId);

        Round round = new Round();
        applyRequest(round, request, fantasyGame);

        roundRepository.save(round);
        return toResponse(round);
    }

    public List<RoundResponse> getAll() {
        return roundRepository.findAll().stream().map(this::toResponse).toList();
    }

    public List<RoundResponse> getByFantasyGame(Long fantasyGameId) {
        return roundRepository.findByFantasyGameId(fantasyGameId).stream().map(this::toResponse).toList();
    }

    public RoundResponse getById(Long id) {
        return toResponse(findRoundOrThrow(id));
    }

    public RoundResponse update(Long id, RoundRequest request, Long userId) {
        Round round = findRoundOrThrow(id);
        FantasyGame fantasyGame = findFantasyGameOrThrow(request.fantasyGameId());
        requireFantasyGameOwnerOrAdmin(fantasyGame, userId);

        applyRequest(round, request, fantasyGame);

        roundRepository.save(round);
        return toResponse(round);
    }

    public void delete(Long id, Long userId) {
        Round round = findRoundOrThrow(id);
        requireFantasyGameOwnerOrAdmin(round.getFantasyGame(), userId);
        roundRepository.delete(round);
    }

    private void applyRequest(Round round, RoundRequest request, FantasyGame fantasyGame) {
        round.setRoundNumber(request.roundNumber());
        round.setFantasyGame(fantasyGame);
        round.setStartDate(request.startDate());
        round.setEndDate(request.endDate());
        round.setTransferDeadline(request.transferDeadline());
        round.setStatus(request.status());
    }

    private Round findRoundOrThrow(Long id) {
        return roundRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Round not found"));
    }

    private FantasyGame findFantasyGameOrThrow(Long id) {
        return fantasyGameRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "FantasyGame not found"));
    }

    private void requireFantasyGameOwnerOrAdmin(FantasyGame fantasyGame, Long userId) {
        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        boolean isOwner = fantasyGame.getCreatedBy().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == UserRole.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new AccessDeniedException("Only the fantasyGame owner or an admin can manage its rounds");
        }
    }

    private RoundResponse toResponse(Round round) {
        return new RoundResponse(
                round.getId(),
                round.getRoundNumber(),
                round.getFantasyGame().getId(),
                round.getFantasyGame().getName(),
                round.getStartDate(),
                round.getEndDate(),
                round.getTransferDeadline(),
                round.getStatus()
        );
    }
}
