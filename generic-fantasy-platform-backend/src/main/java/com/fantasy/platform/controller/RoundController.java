package com.fantasy.platform.controller;

import com.fantasy.platform.dto.round.RoundRequest;
import com.fantasy.platform.dto.round.RoundResponse;
import com.fantasy.platform.security.UserPrincipal;
import com.fantasy.platform.service.RoundService;
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
@RequestMapping("/rounds")
@RequiredArgsConstructor
public class RoundController {

    private final RoundService roundService;

    @PostMapping
    public ResponseEntity<RoundResponse> create(@Valid @RequestBody RoundRequest request,
                                                 @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(roundService.create(request, principal.getUser().getId()));
    }

    @GetMapping
    public ResponseEntity<List<RoundResponse>> getAll(@RequestParam(required = false) Long domainId) {
        if (domainId != null) {
            return ResponseEntity.ok(roundService.getByDomain(domainId));
        }
        return ResponseEntity.ok(roundService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RoundResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(roundService.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RoundResponse> update(@PathVariable Long id,
                                                 @Valid @RequestBody RoundRequest request,
                                                 @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(roundService.update(id, request, principal.getUser().getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                        @AuthenticationPrincipal UserPrincipal principal) {
        roundService.delete(id, principal.getUser().getId());
        return ResponseEntity.noContent().build();
    }
}
