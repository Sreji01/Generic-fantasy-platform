package com.fantasy.platform.controller;

import com.fantasy.platform.dto.player.PlayerRequest;
import com.fantasy.platform.dto.player.PlayerResponse;
import com.fantasy.platform.security.UserPrincipal;
import com.fantasy.platform.service.PlayerService;
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
@RequestMapping("/players")
@RequiredArgsConstructor
public class PlayerController {

    private final PlayerService playerService;

    @PostMapping
    public ResponseEntity<PlayerResponse> create(@Valid @RequestBody PlayerRequest request,
                                                  @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(playerService.create(request, principal.getUser().getId()));
    }

    @GetMapping
    public ResponseEntity<List<PlayerResponse>> getAll(@RequestParam(required = false) Long domainId) {
        if (domainId != null) {
            return ResponseEntity.ok(playerService.getByDomain(domainId));
        }
        return ResponseEntity.ok(playerService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlayerResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(playerService.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PlayerResponse> update(@PathVariable Long id,
                                                  @Valid @RequestBody PlayerRequest request,
                                                  @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(playerService.update(id, request, principal.getUser().getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                        @AuthenticationPrincipal UserPrincipal principal) {
        playerService.delete(id, principal.getUser().getId());
        return ResponseEntity.noContent().build();
    }
}
