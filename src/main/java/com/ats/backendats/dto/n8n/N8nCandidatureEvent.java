package com.ats.backendats.dto.n8n;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class N8nCandidatureEvent {

    private String eventType;
    private Long candidatureId;
    private Long candidatId;
    private String candidatNom;
    private String candidatEmail;
    private Long fichePosteId;
    private String fichePosteTitre;
    private String statut;
    private String ancienStatut;
    private LocalDate datePostulation;
    private Double scoreCompatibilite;
    private String timestamp;
}
