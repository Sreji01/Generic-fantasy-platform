package com.fantasy.platform.service;

import com.fantasy.platform.dto.domain.DomainRequest;
import com.fantasy.platform.dto.domain.DomainResponse;
import com.fantasy.platform.entity.Domain;
import com.fantasy.platform.entity.User;
import com.fantasy.platform.entity.UserRole;
import com.fantasy.platform.repository.DomainRepository;
import com.fantasy.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DomainService {

    private final DomainRepository domainRepository;
    private final UserRepository userRepository;

    public DomainResponse create(DomainRequest request, Long userId) {
        User currentUser = findUserOrThrow(userId);

        Domain domain = new Domain();
        domain.setName(request.name());
        domain.setDescription(request.description());
        domain.setScoringRulesJson(request.scoringRulesJson());
        domain.setPositionsJson(request.positionsJson());
        domain.setCreatedBy(currentUser);

        domainRepository.save(domain);
        return toResponse(domain);
    }

    public List<DomainResponse> getAll() {
        return domainRepository.findAll().stream().map(this::toResponse).toList();
    }

    public DomainResponse getById(Long id) {
        return toResponse(findDomainOrThrow(id));
    }

    public DomainResponse update(Long id, DomainRequest request, Long userId) {
        Domain domain = findDomainOrThrow(id);
        requireOwnerOrAdmin(domain, userId);

        domain.setName(request.name());
        domain.setDescription(request.description());
        domain.setScoringRulesJson(request.scoringRulesJson());
        domain.setPositionsJson(request.positionsJson());

        domainRepository.save(domain);
        return toResponse(domain);
    }

    public void delete(Long id, Long userId) {
        Domain domain = findDomainOrThrow(id);
        requireOwnerOrAdmin(domain, userId);
        domainRepository.delete(domain);
    }

    private Domain findDomainOrThrow(Long id) {
        return domainRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Domain not found"));
    }

    private User findUserOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    private void requireOwnerOrAdmin(Domain domain, Long userId) {
        User currentUser = findUserOrThrow(userId);

        boolean isOwner = domain.getCreatedBy().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == UserRole.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new AccessDeniedException("Only the domain owner or an admin can modify this domain");
        }
    }

    private DomainResponse toResponse(Domain domain) {
        return new DomainResponse(
                domain.getId(),
                domain.getName(),
                domain.getDescription(),
                domain.getScoringRulesJson(),
                domain.getPositionsJson(),
                domain.getCreatedBy().getId(),
                domain.getCreatedBy().getUsername()
        );
    }
}
