package com.ats.backendats.dto.response;

import lombok.Data;

@Data
public class AuthResponse {
    private String token;
    private String role;
    private Long userId;
    private String email;
    private String nom;
    private String prenom;

    // 2FA fields
    private boolean requiresTwoFactor;
    private String tempEmail; // sent back so frontend knows where to verify

    public AuthResponse() {}

    // Full auth (no 2FA needed)
    public AuthResponse(String token, String role, Long userId, String email, String nom, String prenom) {
        this.token = token;
        this.role = role;
        this.userId = userId;
        this.email = email;
        this.nom = nom;
        this.prenom = prenom;
        this.requiresTwoFactor = false;
    }

    // 2FA pending
    public static AuthResponse pendingTwoFactor(String email) {
        AuthResponse r = new AuthResponse();
        r.requiresTwoFactor = true;
        r.tempEmail = email;
        return r;
    }
}