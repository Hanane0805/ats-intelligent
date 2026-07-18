package com.ats.backendats.controller;

import com.ats.backendats.dto.response.DashboardStatsResponse;
import com.ats.backendats.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final CandidatRepository candidatRepository;
    private final CandidatureRepository candidatureRepository;
    private final FichePosteRepository fichePosteRepository;

    private final JournalAuditRepository journalAuditRepository;
    private final RoleRepository roleRepository;
    private final RecruteurRHRepository recruteurRHRepository;
    private final AdministrateurRHRepository administrateurRHRepository;

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsResponse> getStats() {
        long totalCandidats = candidatRepository.count();
        long totalCandidatures = candidatureRepository.count();
        long totalPostes = fichePosteRepository.count();

        // Statut enum names: OUVERT, FERME, etc.
        long postesActifs = fichePosteRepository.findAll().stream()
                .filter(p -> p.getStatut() != null && p.getStatut().name().equalsIgnoreCase("OUVERT"))
                .count();

        long candidaturesEnAttente = candidatureRepository.findAll().stream()
                .filter(c -> c.getStatut() != null && c.getStatut().name().equalsIgnoreCase("EN_ATTENTE"))
                .count();

        double scoreMoyen = candidatureRepository.findAll().stream()
                .filter(c -> c.getScoreCompatibilite() != null)
                .mapToDouble(c -> c.getScoreCompatibilite())
                .average()
                .orElse(0.0);

        long acceptees = candidatureRepository.findAll().stream()
                .filter(c -> c.getStatut() != null && c.getStatut().name().equalsIgnoreCase("ACCEPTE"))
                .count();

        long rejetees = candidatureRepository.findAll().stream()
                .filter(c -> c.getStatut() != null && c.getStatut().name().equalsIgnoreCase("REJETE"))
                .count();

        return ResponseEntity.ok(DashboardStatsResponse.builder()
                .totalCandidats(totalCandidats)
                .totalCandidatures(totalCandidatures)
                .totalPostes(totalPostes)
                .postesActifs(postesActifs)
                .candidaturesEnAttente(candidaturesEnAttente)
                .scoreMoyenAnalyse(Math.round(scoreMoyen * 10.0) / 10.0)
                .candidaturesAcceptees(acceptees)
                .candidaturesRejetees(rejetees)
                .build());
    }

    @GetMapping("/admin-stats")
    public ResponseEntity<java.util.Map<String, Long>> getAdminStats() {
        long totalUsers = recruteurRHRepository.count() + administrateurRHRepository.count();
        long totalRoles = roleRepository.count();
        long totalLogs = journalAuditRepository.count();

        java.util.Map<String, Long> stats = new java.util.HashMap<>();
        stats.put("totalUsers", totalUsers);
        stats.put("totalRoles", totalRoles);
        stats.put("totalLogs", totalLogs);

        return ResponseEntity.ok(stats);
    }
}
