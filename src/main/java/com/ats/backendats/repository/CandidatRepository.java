package com.ats.backendats.repository;

import com.ats.backendats.model.Candidat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface CandidatRepository extends JpaRepository<Candidat, Long> {
    Optional<Candidat> findByEmail(String email);
    boolean existsByEmail(String email);
    List<Candidat> findByNomContainingOrPrenomContaining(String nom, String prenom);
}