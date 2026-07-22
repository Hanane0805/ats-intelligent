package com.ats.backendats.service;

import com.ats.backendats.config.JwtService;
import com.ats.backendats.dto.response.OAuth2Response;
import com.ats.backendats.model.Utilisateur;
import com.ats.backendats.model.RecruteurRH;
import com.ats.backendats.repository.RecruteurRHRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
public class OAuth2Service {

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String googleClientId;

    @Value("${spring.security.oauth2.client.registration.google.client-secret}")
    private String googleClientSecret;

    @Value("${spring.security.oauth2.client.registration.google.redirect-uri}")
    private String googleRedirectUri;

    @Value("${spring.security.oauth2.client.provider.google.token-uri}")
    private String googleTokenUri;

    @Value("${spring.security.oauth2.client.provider.google.user-info-uri}")
    private String googleUserInfoUri;

    private final JwtService jwtService;
    private final RecruteurRHRepository recruteurRHRepository;
    private final PasswordEncoder passwordEncoder;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public OAuth2Service(JwtService jwtService,
                         RecruteurRHRepository recruteurRHRepository,
                         PasswordEncoder passwordEncoder) {
        this.jwtService = jwtService;
        this.recruteurRHRepository = recruteurRHRepository;
        this.passwordEncoder = passwordEncoder;
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    public String getGoogleAuthorizationUrl() {
        return "https://accounts.google.com/o/oauth2/v2/auth"
                + "?client_id=" + googleClientId
                + "&redirect_uri=" + googleRedirectUri
                + "&response_type=code"
                + "&scope=openid%20email%20profile"
                + "&access_type=offline";
    }

    public OAuth2Response handleGoogleCallback(String code) {
        String googleAccessToken = exchangeCodeForToken(code);
        Map<String, String> userInfo = getUserInfoFromGoogle(googleAccessToken);

        String email = userInfo.get("email");
        String nom = userInfo.getOrDefault("family_name", "Utilisateur");
        String prenom = userInfo.getOrDefault("given_name", "Google");

        Optional<RecruteurRH> existingUser = recruteurRHRepository.findByEmail(email);

        RecruteurRH user;
        if (existingUser.isEmpty()) {
            // Création automatique du compte RecruteurRH
            user = new RecruteurRH();
            user.setEmail(email);
            user.setNom(nom);
            user.setPrenom(prenom);
            // Mot de passe aléatoire (l'utilisateur se connectera via Google)
            user.setMotDePasse(passwordEncoder.encode(java.util.UUID.randomUUID().toString()));
            user.setDepartement("RH (Google)");
            user = recruteurRHRepository.save(user);
        } else {
            user = existingUser.get();
        }

        String token = jwtService.generateToken(email, "RECRUTEUR", user.getId(), 86400000L);

        return OAuth2Response.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .provider("google")
                .build();
    }

    private String exchangeCodeForToken(String code) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("code", code);
        params.add("client_id", googleClientId);
        params.add("client_secret", googleClientSecret);
        params.add("redirect_uri", googleRedirectUri);
        params.add("grant_type", "authorization_code");

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(
                googleTokenUri, request, String.class);

        try {
            JsonNode jsonNode = objectMapper.readTree(response.getBody());
            return jsonNode.get("access_token").asText();
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de l'echange du code Google", e);
        }
    }

    private Map<String, String> getUserInfoFromGoogle(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);

        HttpEntity<Void> request = new HttpEntity<>(headers);

        ResponseEntity<String> response = restTemplate.exchange(
                googleUserInfoUri, HttpMethod.GET, request, String.class);

        try {
            JsonNode jsonNode = objectMapper.readTree(response.getBody());
            return Map.of(
                    "email", jsonNode.get("email").asText(),
                    "family_name", jsonNode.has("family_name") ? jsonNode.get("family_name").asText() : "",
                    "given_name", jsonNode.has("given_name") ? jsonNode.get("given_name").asText() : ""
            );
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la recuperation des infos Google", e);
        }
    }
}