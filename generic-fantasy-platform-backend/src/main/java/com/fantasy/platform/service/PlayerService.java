package com.fantasy.platform.service;

import com.fantasy.platform.dto.player.PlayerRequest;
import com.fantasy.platform.dto.player.PlayerResponse;
import com.fantasy.platform.entity.FantasyGame;
import com.fantasy.platform.entity.Player;
import com.fantasy.platform.entity.User;
import com.fantasy.platform.entity.UserRole;
import com.fantasy.platform.repository.FantasyGameRepository;
import com.fantasy.platform.repository.PlayerRepository;
import com.fantasy.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PlayerService {

    private final PlayerRepository playerRepository;
    private final FantasyGameRepository fantasyGameRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    public PlayerResponse create(PlayerRequest request, Long userId) {
        FantasyGame fantasyGame = findFantasyGameOrThrow(request.fantasyGameId());
        requireFantasyGameOwnerOrAdmin(fantasyGame, userId);

        Player player = new Player();
        applyRequest(player, request, fantasyGame);

        playerRepository.save(player);
        return toResponse(player);
    }

    public List<PlayerResponse> getAll() {
        return playerRepository.findAll().stream().map(this::toResponse).toList();
    }

    public List<PlayerResponse> getByFantasyGame(Long fantasyGameId) {
        return playerRepository.findByFantasyGameId(fantasyGameId).stream().map(this::toResponse).toList();
    }

    public PlayerResponse getById(Long id) {
        return toResponse(findPlayerOrThrow(id));
    }

    public PlayerResponse update(Long id, PlayerRequest request, Long userId) {
        Player player = findPlayerOrThrow(id);
        FantasyGame fantasyGame = findFantasyGameOrThrow(request.fantasyGameId());
        requireFantasyGameOwnerOrAdmin(fantasyGame, userId);

        applyRequest(player, request, fantasyGame);
        playerRepository.save(player);
        return toResponse(player);
    }

    public void delete(Long id, Long userId) {
        Player player = findPlayerOrThrow(id);
        requireFantasyGameOwnerOrAdmin(player.getFantasyGame(), userId);
        playerRepository.delete(player);
    }

    public PlayerResponse uploadImage(Long id, MultipartFile file, Long userId) {
        Player player = findPlayerOrThrow(id);
        requireFantasyGameOwnerOrAdmin(player.getFantasyGame(), userId);

        player.setImageUrl(fileStorageService.storePlayerImage(id, file));
        playerRepository.save(player);
        return toResponse(player);
    }

    private void applyRequest(Player player, PlayerRequest request, FantasyGame fantasyGame) {
        player.setFirstName(request.firstName());
        player.setLastName(request.lastName());
        player.setPosition(request.position());
        player.setRealTeam(request.realTeam());
        player.setPrice(request.price());
        player.setImageUrl(request.imageUrl());
        player.setFantasyGame(fantasyGame);
    }

    private Player findPlayerOrThrow(Long id) {
        return playerRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Player not found"));
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
            throw new AccessDeniedException("Only the fantasyGame owner or an admin can manage its players");
        }
    }

    private PlayerResponse toResponse(Player player) {
        return new PlayerResponse(
                player.getId(),
                player.getFirstName(),
                player.getLastName(),
                player.getPosition(),
                player.getRealTeam(),
                player.getPrice(),
                player.getImageUrl(),
                player.getFantasyGame().getId()
        );
    }
}
