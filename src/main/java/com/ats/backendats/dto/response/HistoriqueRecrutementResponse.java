package com.ats.backendats.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class HistoriqueRecrutementResponse {
    private Long id;
    private String ancienStatut;
    private String nouveauStatut;
    private LocalDate dateChangement;
    private String commentaire;
    private Long candidatId;
    private String candidatNom;
    private Long candidatureId;
    private String posteTitre;
}
