package com.fantasy.platform.service;

import com.fantasy.platform.dto.auth.AuthResponse;
import com.fantasy.platform.dto.user.ChangePasswordRequest;
import com.fantasy.platform.dto.user.UpdateUsernameRequest;
import com.fantasy.platform.dto.user.UserResponse;
import com.fantasy.platform.entity.User;
import com.fantasy.platform.repository.UserRepository;
import com.fantasy.platform.security.JwtService;
import com.fantasy.platform.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public UserResponse getMe(Long userId) {
        return toResponse(findUserOrThrow(userId));
    }

    public AuthResponse updateUsername(Long userId, UpdateUsernameRequest request) {
        User user = findUserOrThrow(userId);
        String newUsername = request.username().trim();

        if (!newUsername.equals(user.getUsername()) && userRepository.existsByUsername(newUsername)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already taken");
        }

        user.setUsername(newUsername);
        userRepository.save(user);

        String token = jwtService.generateToken(new UserPrincipal(user));
        return new AuthResponse(token, user.getUsername(), user.getEmail(), user.getRole().name());
    }

    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = findUserOrThrow(userId);

        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    private User findUserOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(user.getId(), user.getUsername(), user.getEmail(), user.getRole(), user.getCreatedAt());
    }
}
