package com.ats.backendats.controller;

import com.ats.backendats.dto.response.OAuth2Response;
import com.ats.backendats.service.OAuth2Service;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth/oauth2")
public class OAuth2Controller {

    private final OAuth2Service oauth2Service;

    public OAuth2Controller(OAuth2Service oauth2Service) {
        this.oauth2Service = oauth2Service;
    }

    // Frontend appelle ça pour obtenir l'URL Google
    @GetMapping("/google/url")
    public ResponseEntity<Map<String, String>> getGoogleAuthUrl() {
        String url = oauth2Service.getGoogleAuthorizationUrl();
        return ResponseEntity.ok(Map.of("authorizationUrl", url));
    }

    // Google redirige ici après autorisation
    @GetMapping("/google/callback")
    public ResponseEntity<OAuth2Response> googleCallback(
            @RequestParam("code") String code) {
        OAuth2Response response = oauth2Service.handleGoogleCallback(code);
        return ResponseEntity.ok(response);
    }
}