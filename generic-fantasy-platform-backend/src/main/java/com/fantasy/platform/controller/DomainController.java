package com.fantasy.platform.controller;

import com.fantasy.platform.dto.domain.DomainRequest;
import com.fantasy.platform.dto.domain.DomainResponse;
import com.fantasy.platform.security.UserPrincipal;
import com.fantasy.platform.service.DomainService;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/domains")
@RequiredArgsConstructor
public class DomainController {

    private final DomainService domainService;

    @PostMapping
    public ResponseEntity<DomainResponse> create(@Valid @RequestBody DomainRequest request,
                                                  @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(domainService.create(request, principal.getUser().getId()));
    }

    @GetMapping
    public ResponseEntity<List<DomainResponse>> getAll() {
        return ResponseEntity.ok(domainService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DomainResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(domainService.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DomainResponse> update(@PathVariable Long id,
                                                  @Valid @RequestBody DomainRequest request,
                                                  @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(domainService.update(id, request, principal.getUser().getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                        @AuthenticationPrincipal UserPrincipal principal) {
        domainService.delete(id, principal.getUser().getId());
        return ResponseEntity.noContent().build();
    }
}
