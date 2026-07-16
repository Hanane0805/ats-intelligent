package com.ats.backendats.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OAuth2Response {
    private String accessToken;   // ton JWT
    private String tokenType;
    private String provider;      // "google" ou "linkedin"
}