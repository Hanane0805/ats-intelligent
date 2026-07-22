package com.ats.backendats.controller;

import com.ats.backendats.dto.request.LoginRequest;
import com.ats.backendats.dto.request.RegisterRecruteurRequest;
import com.ats.backendats.dto.response.AuthResponse;
import com.ats.backendats.service.AuthService;
import com.ats.backendats.service.TwoFactorService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final TwoFactorService twoFactorService;

    public AuthController(AuthService authService, TwoFactorService twoFactorService) {
        this.authService = authService;
        this.twoFactorService = twoFactorService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRecruteurRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/2fa/verify")
    public ResponseEntity<AuthResponse> verifyTwoFactor(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String code = body.get("code");
        if (email == null || code == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(authService.verifyTwoFactor(email, code));
    }

    @PostMapping("/2fa/resend")
    public ResponseEntity<Map<String, String>> resendOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null) return ResponseEntity.badRequest().build();
        twoFactorService.generateAndSendOtp(email, false);
        return ResponseEntity.ok(Map.of("message", "Code renvoyé avec succès"));
    }
}