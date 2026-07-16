package com.ats.backendats.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CandidatResponse {
    private Long id;
    private String nom;
    private String prenom;
    private String email;
}