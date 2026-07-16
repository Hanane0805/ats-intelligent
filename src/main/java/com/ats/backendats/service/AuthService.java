package com.ats.backendats.service;

import com.ats.backendats.config.JwtService;
import com.ats.backendats.dto.request.LoginRequest;
import com.ats.backendats.dto.response.AuthResponse;
import com.ats.backendats.repository.AdministrateurRHRepository;
import com.ats.backendats.repository.RecruteurRHRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final RecruteurRHRepository recruteurRepository;
    private final AdministrateurRHRepository administrateurRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(RecruteurRHRepository recruteurRepository,
                       AdministrateurRHRepository administrateurRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.recruteurRepository = recruteurRepository;
        this.administrateurRepository = administrateurRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponse login(LoginRequest request) {
        var admin = administrateurRepository.findByEmail(request.getEmail());
        if (admin.isPresent() && passwordEncoder.matches(request.getMotDePasse(), admin.get().getMotDePasse())) {
            String token = jwtService.generateToken(admin.get().getEmail(), "ADMIN", 86400000L);
            return new AuthResponse(token, "ADMIN", admin.get().getId(), admin.get().getEmail(), admin.get().getNom(), admin.get().getPrenom());
        }

        var recruteur = recruteurRepository.findByEmail(request.getEmail());
        if (recruteur.isPresent() && passwordEncoder.matches(request.getMotDePasse(), recruteur.get().getMotDePasse())) {
            String token = jwtService.generateToken(recruteur.get().getEmail(), "RECRUTEUR", 86400000L);
            return new AuthResponse(token, "RECRUTEUR", recruteur.get().getId(), recruteur.get().getEmail(), recruteur.get().getNom(), recruteur.get().getPrenom());
        }

        throw new RuntimeException("Email ou mot de passe incorrect");
    }
}