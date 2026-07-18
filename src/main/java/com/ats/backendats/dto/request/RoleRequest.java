package com.ats.backendats.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RoleRequest {
    @NotBlank(message = "Le nom du rôle est obligatoire")
    private String nomRole;
    
    private String description;
}
