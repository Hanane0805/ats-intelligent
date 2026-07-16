package com.ats.backendats.repository;

import com.ats.backendats.model.Candidature;
import com.ats.backendats.model.StatutCandidature;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CandidatureRepository extends JpaRepository<Candidature, Long> {
    List<Candidature> findByCandidatId(Long candidatId);
    List<Candidature> findByFichePosteId(Long fichePosteId);
    List<Candidature> findByStatut(StatutCandidature statut);
    Optional<Candidature> findByCandidatIdAndFichePosteId(Long candidatId, Long fichePosteId);
    boolean existsByCandidatIdAndFichePosteId(Long candidatId, Long fichePosteId);
}