package com.fantasy.platform.controller;

import com.fantasy.platform.dto.fantasygame.FantasyGameRequest;
import com.fantasy.platform.dto.fantasygame.FantasyGameResponse;
import com.fantasy.platform.security.UserPrincipal;
import com.fantasy.platform.service.FantasyGameService;
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
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/fantasy-games")
@RequiredArgsConstructor
public class FantasyGameController {

    private final FantasyGameService fantasyGameService;

    @PostMapping
    public ResponseEntity<FantasyGameResponse> create(@Valid @RequestBody FantasyGameRequest request,
                                                  @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(fantasyGameService.create(request, principal.getUser().getId()));
    }

    @GetMapping
    public ResponseEntity<List<FantasyGameResponse>> getAll() {
        return ResponseEntity.ok(fantasyGameService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<FantasyGameResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(fantasyGameService.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FantasyGameResponse> update(@PathVariable Long id,
                                                  @Valid @RequestBody FantasyGameRequest request,
                                                  @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(fantasyGameService.update(id, request, principal.getUser().getId()));
    }

    @PostMapping("/{id}/background-image")
    public ResponseEntity<FantasyGameResponse> uploadBackgroundImage(@PathVariable Long id,
                                                                  @RequestParam("file") MultipartFile file,
                                                                  @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(fantasyGameService.uploadBackgroundImage(id, file, principal.getUser().getId()));
    }

    @PostMapping("/{id}/thumbnail-image")
    public ResponseEntity<FantasyGameResponse> uploadThumbnailImage(@PathVariable Long id,
                                                                @RequestParam("file") MultipartFile file,
                                                                @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(fantasyGameService.uploadThumbnailImage(id, file, principal.getUser().getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                        @AuthenticationPrincipal UserPrincipal principal) {
        fantasyGameService.delete(id, principal.getUser().getId());
        return ResponseEntity.noContent().build();
    }
}
