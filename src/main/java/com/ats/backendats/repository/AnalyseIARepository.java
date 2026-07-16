package com.ats.backendats.repository;

import com.ats.backendats.model.AnalyseIA;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AnalyseIARepository extends JpaRepository<AnalyseIA, Long> {
}