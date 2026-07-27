package com.ats.backendats.repository;

import com.ats.backendats.model.Entretien;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EntretienRepository extends JpaRepository<Entretien, Long> {
    List<Entretien> findByCandidatureId(Long candidatureId);
    List<Entretien> findByCandidatureCandidatId(Long candidatId);
    List<Entretien> findAllByOrderByDateHeureAsc();
}
