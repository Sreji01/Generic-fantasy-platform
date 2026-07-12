package com.fantasy.platform.service;

import com.fantasy.platform.dto.domain.DomainPositionRequest;
import com.fantasy.platform.dto.domain.DomainPositionResponse;
import com.fantasy.platform.dto.domain.DomainRequest;
import com.fantasy.platform.dto.domain.DomainResponse;
import com.fantasy.platform.dto.domain.DomainScoringRuleRequest;
import com.fantasy.platform.dto.domain.DomainScoringRuleResponse;
import com.fantasy.platform.entity.Domain;
import com.fantasy.platform.entity.DomainPosition;
import com.fantasy.platform.entity.ScoringRule;
import com.fantasy.platform.entity.User;
import com.fantasy.platform.entity.UserRole;
import com.fantasy.platform.repository.DomainRepository;
import com.fantasy.platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
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
        domain.setCreatedBy(currentUser);
        domain.setPositions(buildPositions(request.positions(), domain));
        domain.setScoringRules(buildScoringRules(request.scoringRules(), domain));

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

        domain.getPositions().clear();
        domain.getPositions().addAll(buildPositions(request.positions(), domain));

        domain.getScoringRules().clear();
        domain.getScoringRules().addAll(buildScoringRules(request.scoringRules(), domain));

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

    private List<DomainPosition> buildPositions(List<DomainPositionRequest> requests, Domain domain) {
        if (requests == null) {
            return new ArrayList<>();
        }
        List<DomainPosition> positions = new ArrayList<>();
        for (DomainPositionRequest request : requests) {
            DomainPosition position = new DomainPosition();
            position.setName(request.name());
            position.setPlayerCount(request.playerCount());
            position.setXPosition(request.xPosition());
            position.setYPosition(request.yPosition());
            position.setDomain(domain);
            positions.add(position);
        }
        return positions;
    }

    private List<ScoringRule> buildScoringRules(List<DomainScoringRuleRequest> requests, Domain domain) {
        if (requests == null) {
            return new ArrayList<>();
        }
        List<ScoringRule> rules = new ArrayList<>();
        for (DomainScoringRuleRequest request : requests) {
            ScoringRule rule = new ScoringRule();
            rule.setName(request.name());
            rule.setPoints(request.points());
            rule.setDomain(domain);
            rules.add(rule);
        }
        return rules;
    }

    private DomainResponse toResponse(Domain domain) {
        List<DomainPositionResponse> positions = domain.getPositions().stream()
                .map(p -> new DomainPositionResponse(p.getId(), p.getName(), p.getPlayerCount(), p.getXPosition(), p.getYPosition()))
                .toList();

        List<DomainScoringRuleResponse> scoringRules = domain.getScoringRules().stream()
                .map(r -> new DomainScoringRuleResponse(r.getId(), r.getName(), r.getPoints()))
                .toList();

        return new DomainResponse(
                domain.getId(),
                domain.getName(),
                domain.getDescription(),
                scoringRules,
                positions,
                domain.getCreatedBy().getId(),
                domain.getCreatedBy().getUsername()
        );
    }
}
