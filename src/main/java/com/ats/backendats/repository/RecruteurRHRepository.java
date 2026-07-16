package com.ats.backendats.repository;
import java.util.Optional;
import com.ats.backendats.model.RecruteurRH;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RecruteurRHRepository extends JpaRepository<RecruteurRH, Long> {
    List<RecruteurRH> findByDepartement(String departement);
    Optional<RecruteurRH> findByEmail(String email);
}