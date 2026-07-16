package com.ats.backendats.repository;

import com.ats.backendats.model.FichePoste;
import com.ats.backendats.model.StatutPoste;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FichePosteRepository extends JpaRepository<FichePoste, Long> {
    List<FichePoste> findByStatut(StatutPoste statut);
    List<FichePoste> findByTitreContainingIgnoreCase(String titre);
    List<FichePoste> findByRecruteur_Id(Long recruteurId);
}