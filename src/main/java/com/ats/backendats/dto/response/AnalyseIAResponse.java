package com.ats.backendats.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;

@Data
@Builder
public class AnalyseIAResponse {
    private Long id;
    private Double score;
    private String syntheseForces;
    private String syntheseFaiblesses;
    private String recommandation;
    private LocalDate dateAnalyse;
}