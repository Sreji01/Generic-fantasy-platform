package com.fantasy.platform.controller;

import com.fantasy.platform.dto.playerresult.PlayerResultRequest;
import com.fantasy.platform.dto.playerresult.PlayerResultResponse;
import com.fantasy.platform.security.UserPrincipal;
import com.fantasy.platform.service.PlayerResultService;
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
@RequestMapping("/api/player-results")
@RequiredArgsConstructor
public class PlayerResultController {

    private final PlayerResultService playerResultService;

    @PostMapping
    public ResponseEntity<PlayerResultResponse> create(@Valid @RequestBody PlayerResultRequest request,
                                                         @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(playerResultService.create(request, principal.getUser().getId()));
    }

    @GetMapping
    public ResponseEntity<List<PlayerResultResponse>> getAll(@RequestParam(required = false) Long playerId,
                                                               @RequestParam(required = false) Long roundId) {
        if (playerId != null) {
            return ResponseEntity.ok(playerResultService.getByPlayer(playerId));
        }
        if (roundId != null) {
            return ResponseEntity.ok(playerResultService.getByRound(roundId));
        }
        return ResponseEntity.ok(playerResultService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlayerResultResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(playerResultService.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PlayerResultResponse> update(@PathVariable Long id,
                                                         @Valid @RequestBody PlayerResultRequest request,
                                                         @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(playerResultService.update(id, request, principal.getUser().getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                        @AuthenticationPrincipal UserPrincipal principal) {
        playerResultService.delete(id, principal.getUser().getId());
        return ResponseEntity.noContent().build();
    }
}
