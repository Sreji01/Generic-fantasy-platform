package com.fantasy.platform.controller;

import com.fantasy.platform.dto.auth.AuthResponse;
import com.fantasy.platform.dto.user.ChangePasswordRequest;
import com.fantasy.platform.dto.user.UpdateUsernameRequest;
import com.fantasy.platform.dto.user.UserResponse;
import com.fantasy.platform.security.UserPrincipal;
import com.fantasy.platform.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMe(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(userService.getMe(principal.getUser().getId()));
    }

    @PutMapping("/me/username")
    public ResponseEntity<AuthResponse> updateUsername(@Valid @RequestBody UpdateUsernameRequest request,
                                                         @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(userService.updateUsername(principal.getUser().getId(), request));
    }

    @PutMapping("/me/password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request,
                                                @AuthenticationPrincipal UserPrincipal principal) {
        userService.changePassword(principal.getUser().getId(), request);
        return ResponseEntity.noContent().build();
    }
}
