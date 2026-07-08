package com.fantasy.platform.controller;

import com.fantasy.platform.dto.league.LeagueRequest;
import com.fantasy.platform.dto.league.LeagueResponse;
import com.fantasy.platform.security.UserPrincipal;
import com.fantasy.platform.service.LeagueService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/leagues")
@RequiredArgsConstructor
public class LeagueController {

    private final LeagueService leagueService;

    @PostMapping
    public ResponseEntity<LeagueResponse> create(@Valid @RequestBody LeagueRequest request) {
        return ResponseEntity.ok(leagueService.create(request));
    }

    @GetMapping
    public ResponseEntity<List<LeagueResponse>> getAll(@RequestParam(required = false) Long domainId) {
        if (domainId != null) {
            return ResponseEntity.ok(leagueService.getByDomain(domainId));
        }
        return ResponseEntity.ok(leagueService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LeagueResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(leagueService.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<LeagueResponse> update(@PathVariable Long id,
                                                  @Valid @RequestBody LeagueRequest request,
                                                  @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(leagueService.update(id, request, principal.getUser().getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                        @AuthenticationPrincipal UserPrincipal principal) {
        leagueService.delete(id, principal.getUser().getId());
        return ResponseEntity.noContent().build();
    }
}
