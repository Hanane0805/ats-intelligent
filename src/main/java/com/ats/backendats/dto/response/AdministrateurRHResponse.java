package com.ats.backendats.dto;

import lombok.Data;

@Data
public class AdministrateurRHResponse {

    private Long id;
    private String nom;
    private String prenom;
    private String email;
    private Boolean estActif;
}