package com.ats.backendats.repository;

import com.ats.backendats.model.DocumentCV;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DocumentCVRepository extends JpaRepository<DocumentCV, Long> {
    List<DocumentCV> findByCandidatId(Long candidatId);
    List<DocumentCV> findByNomFichierContainingIgnoreCase(String nomFichier);
}