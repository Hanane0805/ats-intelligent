package com.ats.backendats.service;

import com.ats.backendats.config.JwtService;
import com.ats.backendats.dto.request.LoginRequest;
import com.ats.backendats.dto.request.RegisterRecruteurRequest;
import com.ats.backendats.dto.request.RegisterCandidatRequest;
import com.ats.backendats.dto.response.AuthResponse;
import com.ats.backendats.model.RecruteurRH;
import com.ats.backendats.model.Candidat;
import com.ats.backendats.repository.AdministrateurRHRepository;
import com.ats.backendats.repository.RecruteurRHRepository;
import com.ats.backendats.repository.CandidatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final RecruteurRHRepository recruteurRepository;
    private final AdministrateurRHRepository administrateurRepository;
    private final CandidatRepository candidatRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final TwoFactorService twoFactorService;

    @org.springframework.beans.factory.annotation.Value("${app.2fa.enabled:true}")
    private boolean twoFaEnabled;

    private static final long SESSION_SHORT = 86400000L;
    private static final long SESSION_LONG  = 2592000000L;

    public AuthResponse login(LoginRequest request) {
        var admin = administrateurRepository.findByEmail(request.getEmail());
        if (admin.isPresent() && passwordEncoder.matches(request.getMotDePasse(), admin.get().getMotDePasse())) {
            if (twoFaEnabled) {
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
                twoFactorService.generateAndSendOtp(request.getEmail(), request.isRememberMe());
                return AuthResponse.pendingTwoFactor(request.getEmail());
            } else {
                long expiration = request.isRememberMe() ? SESSION_LONG : SESSION_SHORT;
                String token = jwtService.generateToken(recruteur.get().getEmail(), "RECRUTEUR", recruteur.get().getId(), expiration);
                return new AuthResponse(token, "RECRUTEUR", recruteur.get().getId(), recruteur.get().getEmail(), recruteur.get().getNom(), recruteur.get().getPrenom());
            }
        }

        var candidat = candidatRepository.findByEmail(request.getEmail());
        if (candidat.isPresent() && passwordEncoder.matches(request.getMotDePasse(), candidat.get().getMotDePasse())) {
            long expiration = request.isRememberMe() ? SESSION_LONG : SESSION_SHORT;
            String token = jwtService.generateToken(candidat.get().getEmail(), "CANDIDAT", candidat.get().getId(), expiration);
            return new AuthResponse(token, "CANDIDAT", candidat.get().getId(), candidat.get().getEmail(), candidat.get().getNom(), candidat.get().getPrenom());
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

        var candidat = candidatRepository.findByEmail(email);
        if (candidat.isPresent()) {
            String token = jwtService.generateToken(email, "CANDIDAT", candidat.get().getId(), expiration);
            return new AuthResponse(token, "CANDIDAT", candidat.get().getId(), email, candidat.get().getNom(), candidat.get().getPrenom());
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

    public AuthResponse registerCandidat(RegisterCandidatRequest request) {
        if (candidatRepository.findByEmail(request.getEmail()).isPresent() ||
                recruteurRepository.findByEmail(request.getEmail()).isPresent() ||
                administrateurRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Un compte avec cet email existe déjà");
        }

        Candidat candidat = new Candidat();
        candidat.setNom(request.getNom());
        candidat.setPrenom(request.getPrenom());
        candidat.setEmail(request.getEmail());
        candidat.setMotDePasse(passwordEncoder.encode(request.getMotDePasse()));
        candidat = candidatRepository.save(candidat);

        String token = jwtService.generateToken(candidat.getEmail(), "CANDIDAT", candidat.getId(), SESSION_SHORT);
        return new AuthResponse(token, "CANDIDAT", candidat.getId(), candidat.getEmail(), candidat.getNom(), candidat.getPrenom());
    }
}