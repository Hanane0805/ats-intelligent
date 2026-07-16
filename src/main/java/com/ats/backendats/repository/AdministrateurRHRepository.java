package com.ats.backendats.repository;
import java.util.Optional;
import com.ats.backendats.model.AdministrateurRH;
import org.springframework.data.jpa.repository.JpaRepository;


public interface AdministrateurRHRepository extends JpaRepository<AdministrateurRH, Long> {
    Optional<AdministrateurRH> findByEmail(String email);
}