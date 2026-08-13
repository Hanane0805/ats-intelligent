package com.ats.backendats.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "candidats")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Candidat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private String prenom;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String motDePasse;

    private Boolean estActif = true;
}