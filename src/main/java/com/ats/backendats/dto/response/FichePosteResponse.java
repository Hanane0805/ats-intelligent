package com.ats.backendats.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;

@Data
@Builder
public class FichePosteResponse {
    private Long id;
    private String titre;
    private String description;
    private LocalDate dateCreation;
    private String statut;
    private Long recruteurId;
    private String recruteurNom;
}