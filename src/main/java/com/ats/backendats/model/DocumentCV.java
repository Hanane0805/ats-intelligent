package com.ats.backendats.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "documents_cv")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentCV {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nom_fichier", nullable = false)
    private String nomFichier;

    @Column(name = "chemin_stockage")
    private String cheminStockage;

    @Column(name = "texte_brut", columnDefinition = "TEXT")
    private String texteBrut;

    @Column(name = "date_upload")
    private LocalDate dateUpload;

    @OneToOne
    @JoinColumn(name = "candidat_id")
    private Candidat candidat;

    @OneToMany(mappedBy = "documentCV", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CVChunk> chunks;
}