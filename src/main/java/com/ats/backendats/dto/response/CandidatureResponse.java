package com.ats.backendats.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;

@Data
@Builder
public class CandidatureResponse {
    private Long id;
    private LocalDate datePostulation;
    private Double scoreCompatibilite;
    private String statut;
    private Long candidatId;
    private String candidatNom;
    private Long fichePosteId;
    private String fichePosteTitre;
    private AnalyseIAResponse analyseIA;
}