package com.ats.backendats.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class NotificationRequest {

    @NotBlank
    private String titre;

    @NotBlank
    private String message;

    @NotNull
    private Long utilisateurId;
}
