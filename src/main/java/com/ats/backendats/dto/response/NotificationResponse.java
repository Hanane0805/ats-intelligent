package com.ats.backendats.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class NotificationResponse {
    private Long id;
    private String titre;
    private String message;
    private LocalDateTime dateCreation;
    private Boolean estLu;
    private Long utilisateurId;
}