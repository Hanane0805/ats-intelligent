package com.ats.backendats.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CandidatExtractionResponse {
    private String nom;
    private String prenom;
    private String email;
    private String telephone;
    private List<String> competences;
    private String resume;
}
