package com.ats.backendats.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "fiches_poste")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FichePoste {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "date_creation")
    private LocalDate dateCreation;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut")
    private StatutPoste statut;

    @ManyToOne
    @JoinColumn(name = "recruteur_id")
    private RecruteurRH recruteur;
}