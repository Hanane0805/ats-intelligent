package com.ats.backendats.service;

import com.ats.backendats.config.JwtService;
import com.ats.backendats.dto.request.LoginRequest;
import com.ats.backendats.dto.request.RegisterRecruteurRequest;
import com.ats.backendats.dto.response.AuthResponse;
import com.ats.backendats.model.RecruteurRH;
import com.ats.backendats.repository.AdministrateurRHRepository;
import com.ats.backendats.repository.RecruteurRHRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final RecruteurRHRepository recruteurRepository;
    private final AdministrateurRHRepository administrateurRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final TwoFactorService twoFactorService;

    @org.springframework.beans.factory.annotation.Value("${app.2fa.enabled:true}")
    private boolean twoFaEnabled;

    // 30 days for "remember me", 24h otherwise
    private static final long SESSION_SHORT = 86400000L;      // 1 day
    private static final long SESSION_LONG  = 2592000000L;    // 30 days

    public AuthResponse login(LoginRequest request) {
        var admin = administrateurRepository.findByEmail(request.getEmail());
        if (admin.isPresent() && passwordEncoder.matches(request.getMotDePasse(), admin.get().getMotDePasse())) {
            if (twoFaEnabled) {
                // Trigger 2FA
                twoFactorService.generateAndSendOtp(request.getEmail(), request.isRememberMe());
                return AuthResponse.pendingTwoFactor(request.getEmail());
            } else {
                long expiration = request.isRememberMe() ? SESSION_LONG : SESSION_SHORT;
                String token = jwtService.generateToken(admin.get().getEmail(), "ADMIN", admin.get().getId(), expiration);
                return new AuthResponse(token, "ADMIN", admin.get().getId(), admin.get().getEmail(), admin.get().getNom(), admin.get().getPrenom());
            }
        }

        var recruteur = recruteurRepository.findByEmail(request.getEmail());
        if (recruteur.isPresent() && passwordEncoder.matches(request.getMotDePasse(), recruteur.get().getMotDePasse())) {
            if (twoFaEnabled) {
                // Trigger 2FA
                twoFactorService.generateAndSendOtp(request.getEmail(), request.isRememberMe());
                return AuthResponse.pendingTwoFactor(request.getEmail());
            } else {
                long expiration = request.isRememberMe() ? SESSION_LONG : SESSION_SHORT;
                String token = jwtService.generateToken(recruteur.get().getEmail(), "RECRUTEUR", recruteur.get().getId(), expiration);
                return new AuthResponse(token, "RECRUTEUR", recruteur.get().getId(), recruteur.get().getEmail(), recruteur.get().getNom(), recruteur.get().getPrenom());
            }
        }

        throw new RuntimeException("Email ou mot de passe incorrect");
    }

    public AuthResponse verifyTwoFactor(String email, String code) {
        if (!twoFactorService.verifyOtp(email, code)) {
            throw new RuntimeException("Code incorrect ou expiré. Veuillez réessayer.");
        }

        boolean rememberMe = twoFactorService.isRememberMe(email);
        twoFactorService.markOtpAsUsed(email);

        long expiration = rememberMe ? SESSION_LONG : SESSION_SHORT;

        // Find user and generate final JWT
        var admin = administrateurRepository.findByEmail(email);
        if (admin.isPresent()) {
            String token = jwtService.generateToken(email, "ADMIN", admin.get().getId(), expiration);
            return new AuthResponse(token, "ADMIN", admin.get().getId(), email, admin.get().getNom(), admin.get().getPrenom());
        }

        var recruteur = recruteurRepository.findByEmail(email);
        if (recruteur.isPresent()) {
            String token = jwtService.generateToken(email, "RECRUTEUR", recruteur.get().getId(), expiration);
            return new AuthResponse(token, "RECRUTEUR", recruteur.get().getId(), email, recruteur.get().getNom(), recruteur.get().getPrenom());
        }

        throw new RuntimeException("Utilisateur introuvable");
    }

    public AuthResponse register(RegisterRecruteurRequest request) {
        if (recruteurRepository.findByEmail(request.getEmail()).isPresent() ||
            administrateurRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Un compte avec cet email existe déjà");
        }

        RecruteurRH recruteur = new RecruteurRH();
        recruteur.setNom(request.getNom());
        recruteur.setPrenom(request.getPrenom());
        recruteur.setEmail(request.getEmail());
        recruteur.setMotDePasse(passwordEncoder.encode(request.getMotDePasse()));
        recruteur.setDepartement(request.getDepartement());
        recruteur = recruteurRepository.save(recruteur);

        String token = jwtService.generateToken(recruteur.getEmail(), "RECRUTEUR", recruteur.getId(), SESSION_SHORT);
        return new AuthResponse(token, "RECRUTEUR", recruteur.getId(), recruteur.getEmail(), recruteur.getNom(), recruteur.getPrenom());
    }
}