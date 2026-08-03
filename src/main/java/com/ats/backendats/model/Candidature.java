package com.ats.backendats.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "candidatures")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Candidature {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "date_postulation")
    private LocalDate datePostulation;

    @Column(name = "score_compatibilite")
    private Double scoreCompatibilite;

    @Enumerated(EnumType.STRING)
    private StatutCandidature statut;

    @ManyToOne
    @JoinColumn(name = "fiche_poste_id")
    private FichePoste fichePoste;

    @ManyToOne
    @JoinColumn(name = "candidat_id")
    private Candidat candidat;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "analyse_ia_id")
    private AnalyseIA analyseIA;

    @OneToMany(mappedBy = "candidature", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<HistoriqueRecrutement> historiques;

    @OneToMany(mappedBy = "candidature", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Entretien> entretiens;
}