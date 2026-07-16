package com.ats.backendats.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CandidatureRequest {
    @NotNull(message = "L'ID du candidat est obligatoire")
    private Long candidatId;

    @NotNull(message = "L'ID de la fiche de poste est obligatoire")
    private Long fichePosteId;
}