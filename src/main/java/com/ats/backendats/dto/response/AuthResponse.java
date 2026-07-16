package com.ats.backendats.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
public class AuthResponse {
    private String token;
    private String role;
    private Long userId;
    private String email;
    private String nom;
    private String prenom;

    public AuthResponse() {}

    public AuthResponse(String token, String role, Long userId, String email, String nom, String prenom) {
        this.token = token;
        this.role = role;
        this.userId = userId;
        this.email = email;
        this.nom = nom;
        this.prenom = prenom;
    }
}