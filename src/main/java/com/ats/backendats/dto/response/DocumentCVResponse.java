package com.ats.backendats.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;

@Data
@Builder
public class DocumentCVResponse {
    private Long id;
    private String nomFichier;
    private String cheminStockage;
    private String texteBrut;
    private LocalDate dateUpload;
    private Long candidatId;
    private String candidatNom;
    private int nombreChunks;
}