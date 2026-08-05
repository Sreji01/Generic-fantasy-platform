package com.fantasy.platform.controller;

import com.fantasy.platform.dto.user.AdminStatsResponse;
import com.fantasy.platform.dto.user.UpdateUserRoleRequest;
import com.fantasy.platform.dto.user.UserResponse;
import com.fantasy.platform.security.UserPrincipal;
import com.fantasy.platform.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> getStats(@AuthenticationPrincipal UserPrincipal principal) {
        adminService.requireAdmin(principal.getUser().getId());
        return ResponseEntity.ok(adminService.getStats());
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers(@AuthenticationPrincipal UserPrincipal principal) {
        adminService.requireAdmin(principal.getUser().getId());
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<UserResponse> updateUserRole(@PathVariable Long id,
                                                        @Valid @RequestBody UpdateUserRoleRequest request,
                                                        @AuthenticationPrincipal UserPrincipal principal) {
        adminService.requireAdmin(principal.getUser().getId());
        return ResponseEntity.ok(adminService.updateUserRole(id, request, principal.getUser().getId()));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal principal) {
        adminService.requireAdmin(principal.getUser().getId());
        adminService.deleteUser(id, principal.getUser().getId());
        return ResponseEntity.noContent().build();
    }
}
