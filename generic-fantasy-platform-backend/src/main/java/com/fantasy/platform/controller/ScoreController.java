package com.fantasy.platform.controller;

import com.fantasy.platform.dto.score.ScoreRequest;
import com.fantasy.platform.dto.score.ScoreResponse;
import com.fantasy.platform.security.UserPrincipal;
import com.fantasy.platform.service.ScoreService;
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
@RequestMapping("/api/scores")
@RequiredArgsConstructor
public class ScoreController {

    private final ScoreService scoreService;

    @PostMapping
    public ResponseEntity<ScoreResponse> create(@Valid @RequestBody ScoreRequest request,
                                                 @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(scoreService.create(request, principal.getUser().getId()));
    }

    @GetMapping
    public ResponseEntity<List<ScoreResponse>> getAll(@RequestParam(required = false) Long fantasyTeamId,
                                                        @RequestParam(required = false) Long roundId) {
        if (fantasyTeamId != null) {
            return ResponseEntity.ok(scoreService.getByFantasyTeam(fantasyTeamId));
        }
        if (roundId != null) {
            return ResponseEntity.ok(scoreService.getByRound(roundId));
        }
        return ResponseEntity.ok(scoreService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ScoreResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(scoreService.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ScoreResponse> update(@PathVariable Long id,
                                                 @Valid @RequestBody ScoreRequest request,
                                                 @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(scoreService.update(id, request, principal.getUser().getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                        @AuthenticationPrincipal UserPrincipal principal) {
        scoreService.delete(id, principal.getUser().getId());
        return ResponseEntity.noContent().build();
    }
}
