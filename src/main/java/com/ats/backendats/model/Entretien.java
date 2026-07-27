package com.ats.backendats.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "entretiens")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Entretien {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "candidature_id", nullable = false)
    private Candidature candidature;

    @Column(name = "date_heure", nullable = false)
    private LocalDateTime dateHeure;

    @Column(name = "duree_minutes")
    private Integer dureeMinutes = 60;

    @Column(name = "type_entretien")
    private String typeEntretien; // VISIO | PRESENTIEL | TELEPHONIQUE

    @Column(name = "lien_visio")
    private String lienVisio;

    @Column(name = "lieu")
    private String lieu;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut_entretien")
    private StatutEntretien statutEntretien = StatutEntretien.PLANIFIE;

    @Column(name = "date_creation")
    private LocalDateTime dateCreation;
}
