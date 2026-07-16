package com.ats.backendats.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "historiques_recrutement")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HistoriqueRecrutement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ancien_statut")
    private String ancienStatut;

    @Column(name = "nouveau_statut")
    private String nouveauStatut;

    @Column(name = "date_changement")
    private LocalDate dateChangement;

    private String commentaire;

    @ManyToOne
    @JoinColumn(name = "candidat_id")
    private Candidat candidat;

    @ManyToOne
    @JoinColumn(name = "candidature_id")
    private Candidature candidature;
}