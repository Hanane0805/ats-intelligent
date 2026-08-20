package com.ats.backendats.dto.request;

import lombok.Data;

@Data
public class CandidatureUpdateRequest {
    private String statut;
    private Double scoreCompatibilite;
    private String commentaire;
}