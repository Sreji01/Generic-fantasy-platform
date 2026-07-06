package com.fantasy.platform.controller;

import com.fantasy.platform.dto.fantasyteam.FantasyTeamRequest;
import com.fantasy.platform.dto.fantasyteam.FantasyTeamResponse;
import com.fantasy.platform.dto.fantasyteam.StandingEntry;
import com.fantasy.platform.security.UserPrincipal;
import com.fantasy.platform.service.FantasyTeamService;
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
@RequestMapping("/api/fantasy-teams")
@RequiredArgsConstructor
public class FantasyTeamController {

    private final FantasyTeamService fantasyTeamService;

    @PostMapping
    public ResponseEntity<FantasyTeamResponse> create(@Valid @RequestBody FantasyTeamRequest request,
                                                        @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(fantasyTeamService.create(request, principal.getUser().getId()));
    }

    @GetMapping
    public ResponseEntity<List<FantasyTeamResponse>> getAll(@RequestParam(required = false) Long leagueId) {
        if (leagueId != null) {
            return ResponseEntity.ok(fantasyTeamService.getByLeague(leagueId));
        }
        return ResponseEntity.ok(fantasyTeamService.getAll());
    }

    @GetMapping("/standings")
    public ResponseEntity<List<StandingEntry>> getStandings(@RequestParam Long leagueId) {
        return ResponseEntity.ok(fantasyTeamService.getStandingsByLeague(leagueId));
    }

    @GetMapping("/me")
    public ResponseEntity<List<FantasyTeamResponse>> getMine(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(fantasyTeamService.getByUser(principal.getUser().getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FantasyTeamResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(fantasyTeamService.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FantasyTeamResponse> update(@PathVariable Long id,
                                                        @Valid @RequestBody FantasyTeamRequest request,
                                                        @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(fantasyTeamService.update(id, request, principal.getUser().getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                        @AuthenticationPrincipal UserPrincipal principal) {
        fantasyTeamService.delete(id, principal.getUser().getId());
        return ResponseEntity.noContent().build();
    }
}
