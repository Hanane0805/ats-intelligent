package com.ats.backendats.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ConfigurationResponse {
    private Long id;
    private String cleParametre;
    private String valeurParametre;
}