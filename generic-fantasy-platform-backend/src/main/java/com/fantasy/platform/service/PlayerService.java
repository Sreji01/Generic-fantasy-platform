package com.fantasy.platform.service;

import com.fantasy.platform.dto.player.PlayerRequest;
import com.fantasy.platform.dto.player.PlayerResponse;
import com.fantasy.platform.entity.Domain;
import com.fantasy.platform.entity.Player;
import com.fantasy.platform.entity.User;
import com.fantasy.platform.entity.UserRole;
import com.fantasy.platform.repository.DomainRepository;
import com.fantasy.platform.repository.PlayerRepository;
import com.fantasy.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PlayerService {

    private final PlayerRepository playerRepository;
    private final DomainRepository domainRepository;
    private final UserRepository userRepository;

    public PlayerResponse create(PlayerRequest request, Long userId) {
        Domain domain = findDomainOrThrow(request.domainId());
        requireDomainOwnerOrAdmin(domain, userId);

        Player player = new Player();
        applyRequest(player, request, domain);

        playerRepository.save(player);
        return toResponse(player);
    }

    public List<PlayerResponse> getAll() {
        return playerRepository.findAll().stream().map(this::toResponse).toList();
    }

    public List<PlayerResponse> getByDomain(Long domainId) {
        return playerRepository.findByDomainId(domainId).stream().map(this::toResponse).toList();
    }

    public PlayerResponse getById(Long id) {
        return toResponse(findPlayerOrThrow(id));
    }

    public PlayerResponse update(Long id, PlayerRequest request, Long userId) {
        Player player = findPlayerOrThrow(id);
        Domain domain = findDomainOrThrow(request.domainId());
        requireDomainOwnerOrAdmin(domain, userId);

        applyRequest(player, request, domain);
        playerRepository.save(player);
        return toResponse(player);
    }

    public void delete(Long id, Long userId) {
        Player player = findPlayerOrThrow(id);
        requireDomainOwnerOrAdmin(player.getDomain(), userId);
        playerRepository.delete(player);
    }

    private void applyRequest(Player player, PlayerRequest request, Domain domain) {
        player.setFirstName(request.firstName());
        player.setLastName(request.lastName());
        player.setPosition(request.position());
        player.setRealTeam(request.realTeam());
        player.setPrice(request.price());
        player.setImageUrl(request.imageUrl());
        player.setDomain(domain);
    }

    private Player findPlayerOrThrow(Long id) {
        return playerRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Player not found"));
    }

    private Domain findDomainOrThrow(Long id) {
        return domainRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Domain not found"));
    }

    private void requireDomainOwnerOrAdmin(Domain domain, Long userId) {
        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        boolean isOwner = domain.getCreatedBy().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == UserRole.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new AccessDeniedException("Only the domain owner or an admin can manage its players");
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
                player.getDomain().getId()
        );
    }
}
