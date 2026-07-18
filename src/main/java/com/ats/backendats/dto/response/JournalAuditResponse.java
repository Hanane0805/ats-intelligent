package com.ats.backendats.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class JournalAuditResponse {
    private Long id;
    private String action;
    private String details;
    private String adresseIP;
    private LocalDateTime dateAction;
    private String utilisateurNom;
}
