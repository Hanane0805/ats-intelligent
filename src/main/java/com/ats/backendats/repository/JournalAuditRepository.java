package com.ats.backendats.repository;

import com.ats.backendats.model.JournalAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface JournalAuditRepository extends JpaRepository<JournalAudit, Long> {
    List<JournalAudit> findByUtilisateurId(Long utilisateurId);
    List<JournalAudit> findByActionContainingIgnoreCase(String action);
}