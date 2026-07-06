package com.fantasy.platform.service;

import com.fantasy.platform.dto.round.RoundRequest;
import com.fantasy.platform.dto.round.RoundResponse;
import com.fantasy.platform.entity.Domain;
import com.fantasy.platform.entity.Round;
import com.fantasy.platform.entity.User;
import com.fantasy.platform.entity.UserRole;
import com.fantasy.platform.repository.DomainRepository;
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
    private final DomainRepository domainRepository;
    private final UserRepository userRepository;

    public RoundResponse create(RoundRequest request, Long userId) {
        Domain domain = findDomainOrThrow(request.domainId());
        requireDomainOwnerOrAdmin(domain, userId);

        Round round = new Round();
        applyRequest(round, request, domain);

        roundRepository.save(round);
        return toResponse(round);
    }

    public List<RoundResponse> getAll() {
        return roundRepository.findAll().stream().map(this::toResponse).toList();
    }

    public List<RoundResponse> getByDomain(Long domainId) {
        return roundRepository.findByDomainId(domainId).stream().map(this::toResponse).toList();
    }

    public RoundResponse getById(Long id) {
        return toResponse(findRoundOrThrow(id));
    }

    public RoundResponse update(Long id, RoundRequest request, Long userId) {
        Round round = findRoundOrThrow(id);
        Domain domain = findDomainOrThrow(request.domainId());
        requireDomainOwnerOrAdmin(domain, userId);

        applyRequest(round, request, domain);

        roundRepository.save(round);
        return toResponse(round);
    }

    public void delete(Long id, Long userId) {
        Round round = findRoundOrThrow(id);
        requireDomainOwnerOrAdmin(round.getDomain(), userId);
        roundRepository.delete(round);
    }

    private void applyRequest(Round round, RoundRequest request, Domain domain) {
        round.setName(request.name());
        round.setRoundNumber(request.roundNumber());
        round.setDomain(domain);
        round.setStartDate(request.startDate());
        round.setEndDate(request.endDate());
        round.setStatus(request.status());
    }

    private Round findRoundOrThrow(Long id) {
        return roundRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Round not found"));
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
            throw new AccessDeniedException("Only the domain owner or an admin can manage its rounds");
        }
    }

    private RoundResponse toResponse(Round round) {
        return new RoundResponse(
                round.getId(),
                round.getName(),
                round.getRoundNumber(),
                round.getDomain().getId(),
                round.getDomain().getName(),
                round.getStartDate(),
                round.getEndDate(),
                round.getStatus()
        );
    }
}
