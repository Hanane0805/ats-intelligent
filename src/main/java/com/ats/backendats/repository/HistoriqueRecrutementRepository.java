package com.ats.backendats.repository;

import com.ats.backendats.model.HistoriqueRecrutement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface HistoriqueRecrutementRepository extends JpaRepository<HistoriqueRecrutement, Long> {
    List<HistoriqueRecrutement> findByCandidatureId(Long candidatureId);
    List<HistoriqueRecrutement> findByCandidatId(Long candidatId);
}