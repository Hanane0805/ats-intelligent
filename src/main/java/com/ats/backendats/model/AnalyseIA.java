package com.ats.backendats.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "analyses_ia")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnalyseIA {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Double score;

    @Column(name = "synthese_forces", columnDefinition = "TEXT")
    private String syntheseForces;

    @Column(name = "synthese_faiblesses", columnDefinition = "TEXT")
    private String syntheseFaiblesses;

    @Column(columnDefinition = "TEXT")
    private String recommandation;

    @Column(name = "date_analyse")
    private LocalDate dateAnalyse;
}