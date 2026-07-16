package com.ats.backendats.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "cv_chunks")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CVChunk {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "contenu_texte", columnDefinition = "TEXT")
    private String contenuTexte;

    @Column(name = "vecteur_embedding", columnDefinition = "vector")
    private float[] vecteurEmbedding;

    @Column(name = "index_ordre")
    private Integer indexOrdre;

    @ManyToOne
    @JoinColumn(name = "document_cv_id")
    private DocumentCV documentCV;
}