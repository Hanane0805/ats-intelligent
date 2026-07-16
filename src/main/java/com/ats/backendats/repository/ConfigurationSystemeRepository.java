package com.ats.backendats.repository;

import com.ats.backendats.model.ConfigurationSysteme;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ConfigurationSystemeRepository extends JpaRepository<ConfigurationSysteme, Long> {
    Optional<ConfigurationSysteme> findByCleParametre(String cleParametre);
}