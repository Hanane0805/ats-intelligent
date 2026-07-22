package com.ats.backendats.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class HistoriqueRecrutementRequest {

    @NotNull
    private Long candidatureId;

    private String ancienStatut;

    @NotBlank
    private String nouveauStatut;

    private String commentaire;
}
