package com.fantasy.platform.service;

import com.fantasy.platform.dto.fantasygame.FantasyGamePositionRequest;
import com.fantasy.platform.dto.fantasygame.FantasyGamePositionResponse;
import com.fantasy.platform.dto.fantasygame.FantasyGameRequest;
import com.fantasy.platform.dto.fantasygame.FantasyGameResponse;
import com.fantasy.platform.dto.fantasygame.FantasyGameScoringRuleRequest;
import com.fantasy.platform.dto.fantasygame.FantasyGameScoringRuleResponse;
import com.fantasy.platform.dto.fantasygame.PositionSlotRequest;
import com.fantasy.platform.dto.fantasygame.PositionSlotResponse;
import com.fantasy.platform.dto.fantasygame.ScoringRulePositionValueRequest;
import com.fantasy.platform.dto.fantasygame.ScoringRulePositionValueResponse;
import com.fantasy.platform.entity.FantasyGame;
import com.fantasy.platform.entity.FantasyGamePosition;
import com.fantasy.platform.entity.PositionSlot;
import com.fantasy.platform.entity.ScoringRule;
import com.fantasy.platform.entity.ScoringRulePositionValue;
import com.fantasy.platform.entity.User;
import com.fantasy.platform.entity.UserRole;
import com.fantasy.platform.repository.FantasyGameRepository;
import com.fantasy.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FantasyGameService {

    private final FantasyGameRepository fantasyGameRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    public FantasyGameResponse create(FantasyGameRequest request, Long userId) {
        User currentUser = findUserOrThrow(userId);

        FantasyGame fantasyGame = new FantasyGame();
        fantasyGame.setName(request.name());
        fantasyGame.setDescription(request.description());
        fantasyGame.setFieldRows(request.fieldRows());
        fantasyGame.setFieldCols(request.fieldCols());
        fantasyGame.setBenchRows(request.benchRows());
        fantasyGame.setBenchCols(request.benchCols());
        fantasyGame.setBackgroundImageUrl(request.backgroundImageUrl());
        fantasyGame.setThumbnailUrl(request.thumbnailUrl());
        fantasyGame.setCreatedBy(currentUser);
        fantasyGame.setPositions(buildPositions(request.positions(), fantasyGame));
        fantasyGame.setScoringRules(buildScoringRules(request.scoringRules(), fantasyGame));

        fantasyGameRepository.save(fantasyGame);
        return toResponse(fantasyGame);
    }

    public List<FantasyGameResponse> getAll() {
        return fantasyGameRepository.findAll().stream().map(this::toResponse).toList();
    }

    public FantasyGameResponse getById(Long id) {
        return toResponse(findFantasyGameOrThrow(id));
    }

    public FantasyGameResponse update(Long id, FantasyGameRequest request, Long userId) {
        FantasyGame fantasyGame = findFantasyGameOrThrow(id);
        requireOwnerOrAdmin(fantasyGame, userId);

        fantasyGame.setName(request.name());
        fantasyGame.setDescription(request.description());
        fantasyGame.setFieldRows(request.fieldRows());
        fantasyGame.setFieldCols(request.fieldCols());
        fantasyGame.setBenchRows(request.benchRows());
        fantasyGame.setBenchCols(request.benchCols());
        fantasyGame.setBackgroundImageUrl(request.backgroundImageUrl());
        fantasyGame.setThumbnailUrl(request.thumbnailUrl());

        fantasyGame.getPositions().clear();
        fantasyGame.getPositions().addAll(buildPositions(request.positions(), fantasyGame));

        fantasyGame.getScoringRules().clear();
        fantasyGame.getScoringRules().addAll(buildScoringRules(request.scoringRules(), fantasyGame));

        fantasyGameRepository.save(fantasyGame);
        return toResponse(fantasyGame);
    }

    public FantasyGameResponse uploadBackgroundImage(Long id, MultipartFile file, Long userId) {
        FantasyGame fantasyGame = findFantasyGameOrThrow(id);
        requireOwnerOrAdmin(fantasyGame, userId);

        fantasyGame.setBackgroundImageUrl(fileStorageService.storeFantasyGameBackgroundImage(id, file));
        fantasyGameRepository.save(fantasyGame);
        return toResponse(fantasyGame);
    }

    public FantasyGameResponse uploadThumbnailImage(Long id, MultipartFile file, Long userId) {
        FantasyGame fantasyGame = findFantasyGameOrThrow(id);
        requireOwnerOrAdmin(fantasyGame, userId);

        fantasyGame.setThumbnailUrl(fileStorageService.storeFantasyGameThumbnailImage(id, file));
        fantasyGameRepository.save(fantasyGame);
        return toResponse(fantasyGame);
    }

    public void delete(Long id, Long userId) {
        FantasyGame fantasyGame = findFantasyGameOrThrow(id);
        requireOwnerOrAdmin(fantasyGame, userId);
        fantasyGameRepository.delete(fantasyGame);
    }

    private FantasyGame findFantasyGameOrThrow(Long id) {
        return fantasyGameRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "FantasyGame not found"));
    }

    private User findUserOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    private void requireOwnerOrAdmin(FantasyGame fantasyGame, Long userId) {
        User currentUser = findUserOrThrow(userId);

        boolean isOwner = fantasyGame.getCreatedBy().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == UserRole.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new AccessDeniedException("Only the fantasyGame owner or an admin can modify this fantasyGame");
        }
    }

    private List<FantasyGamePosition> buildPositions(List<FantasyGamePositionRequest> requests, FantasyGame fantasyGame) {
        if (requests == null) {
            return new ArrayList<>();
        }
        List<FantasyGamePosition> positions = new ArrayList<>();
        for (FantasyGamePositionRequest request : requests) {
            FantasyGamePosition position = new FantasyGamePosition();
            position.setName(request.name());
            position.setFantasyGame(fantasyGame);
            position.setSlots(buildSlots(request.slots(), position));
            positions.add(position);
        }
        return positions;
    }

    private List<PositionSlot> buildSlots(List<PositionSlotRequest> requests, FantasyGamePosition position) {
        if (requests == null) {
            return new ArrayList<>();
        }
        List<PositionSlot> slots = new ArrayList<>();
        for (PositionSlotRequest request : requests) {
            PositionSlot slot = new PositionSlot();
            slot.setRowIndex(request.rowIndex());
            slot.setColIndex(request.colIndex());
            slot.setPosition(position);
            slots.add(slot);
        }
        return slots;
    }

    private List<ScoringRule> buildScoringRules(List<FantasyGameScoringRuleRequest> requests, FantasyGame fantasyGame) {
        if (requests == null) {
            return new ArrayList<>();
        }
        List<ScoringRule> rules = new ArrayList<>();
        for (FantasyGameScoringRuleRequest request : requests) {
            ScoringRule rule = new ScoringRule();
            rule.setName(request.name());
            rule.setFantasyGame(fantasyGame);
            rule.setVariesByPosition(request.variesByPosition());

            if (request.variesByPosition()) {
                if (request.positionValues() == null || request.positionValues().isEmpty()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Scoring rule '" + request.name() + "' must define points for at least one position");
                }
                rule.setPoints(0.0);
                rule.setPositionValues(buildScoringRulePositionValues(request.positionValues(), rule));
            } else {
                if (request.points() == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Scoring rule '" + request.name() + "' must define points");
                }
                rule.setPoints(request.points());
            }

            rules.add(rule);
        }
        return rules;
    }

    private List<ScoringRulePositionValue> buildScoringRulePositionValues(List<ScoringRulePositionValueRequest> requests,
                                                                           ScoringRule rule) {
        List<ScoringRulePositionValue> values = new ArrayList<>();
        for (ScoringRulePositionValueRequest request : requests) {
            ScoringRulePositionValue value = new ScoringRulePositionValue();
            value.setPositionName(request.positionName());
            value.setPoints(request.points());
            value.setScoringRule(rule);
            values.add(value);
        }
        return values;
    }

    private FantasyGameResponse toResponse(FantasyGame fantasyGame) {
        List<FantasyGamePositionResponse> positions = fantasyGame.getPositions().stream()
                .map(p -> new FantasyGamePositionResponse(
                        p.getId(),
                        p.getName(),
                        p.getSlots().stream()
                                .map(s -> new PositionSlotResponse(s.getId(), s.getRowIndex(), s.getColIndex()))
                                .toList()
                ))
                .toList();

        List<FantasyGameScoringRuleResponse> scoringRules = fantasyGame.getScoringRules().stream()
                .map(r -> new FantasyGameScoringRuleResponse(
                        r.getId(),
                        r.getName(),
                        Boolean.TRUE.equals(r.getVariesByPosition()),
                        r.getPoints(),
                        r.getPositionValues().stream()
                                .map(v -> new ScoringRulePositionValueResponse(v.getPositionName(), v.getPoints()))
                                .toList()
                ))
                .toList();

        return new FantasyGameResponse(
                fantasyGame.getId(),
                fantasyGame.getName(),
                fantasyGame.getDescription(),
                fantasyGame.getFieldRows(),
                fantasyGame.getFieldCols(),
                fantasyGame.getBenchRows(),
                fantasyGame.getBenchCols(),
                fantasyGame.getBackgroundImageUrl(),
                fantasyGame.getThumbnailUrl(),
                fantasyGame.getPlayers().size(),
                scoringRules,
                positions,
                fantasyGame.getCreatedBy().getId(),
                fantasyGame.getCreatedBy().getUsername()
        );
    }
}
