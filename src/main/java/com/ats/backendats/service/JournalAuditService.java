package com.ats.backendats.service;

import com.ats.backendats.dto.response.JournalAuditResponse;
import com.ats.backendats.model.JournalAudit;
import com.ats.backendats.repository.JournalAuditRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JournalAuditService {

    private final JournalAuditRepository journalAuditRepository;

    public List<JournalAuditResponse> getAllLogs() {
        return journalAuditRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private JournalAuditResponse mapToResponse(JournalAudit log) {
        String userName = "Système";
        if (log.getUtilisateur() != null) {
            userName = log.getUtilisateur().getPrenom() + " " + log.getUtilisateur().getNom();
        }
        return JournalAuditResponse.builder()
                .id(log.getId())
                .action(log.getAction())
                .details(log.getDetails())
                .adresseIP(log.getAdresseIP())
                .dateAction(log.getDateAction())
                .utilisateurNom(userName)
                .build();
    }
}
