package com.ats.backendats.controller;

import com.ats.backendats.model.Entretien;
import com.ats.backendats.service.EntretienService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/entretiens")
@RequiredArgsConstructor
public class EntretienController {

    private final EntretienService entretienService;

    @GetMapping
    public ResponseEntity<List<Entretien>> getAllEntretiens() {
        return ResponseEntity.ok(entretienService.getAllEntretiens());
    }

    @GetMapping("/candidature/{candidatureId}")
    public ResponseEntity<List<Entretien>> getByCandidature(@PathVariable Long candidatureId) {
        return ResponseEntity.ok(entretienService.getEntretiensByCandidature(candidatureId));
    }

    @GetMapping("/candidat/{candidatId}")
    public ResponseEntity<List<Entretien>> getByCandidat(@PathVariable Long candidatId) {
        return ResponseEntity.ok(entretienService.getEntretiensByCandidat(candidatId));
    }

    @PostMapping("/candidature/{candidatureId}")
    public ResponseEntity<Entretien> planifier(
            @PathVariable Long candidatureId,
            @RequestBody Map<String, Object> body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(entretienService.planifierEntretien(candidatureId, body));
    }

    @PatchMapping("/{id}/statut")
    public ResponseEntity<Entretien> updateStatut(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(entretienService.updateStatut(id, body.get("statut")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        entretienService.deleteEntretien(id);
        return ResponseEntity.noContent().build();
    }
}
