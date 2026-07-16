package com.ats.backendats.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "configurations_systeme")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConfigurationSysteme {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cle_parametre", nullable = false, unique = true)
    private String cleParametre;

    @Column(name = "valeur_parametre")
    private String valeurParametre;
}