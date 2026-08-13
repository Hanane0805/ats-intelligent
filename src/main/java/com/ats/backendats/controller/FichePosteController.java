package com.ats.backendats.controller;

import com.ats.backendats.dto.request.FichePosteRequest;
import com.ats.backendats.dto.response.FichePosteResponse;
import com.ats.backendats.service.FichePosteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fiches-poste")
@RequiredArgsConstructor
public class FichePosteController {

    private final FichePosteService fichePosteService;

    @GetMapping
    public ResponseEntity<List<FichePosteResponse>> getAllFiches() {
        return ResponseEntity.ok(fichePosteService.getAllFiches());
    }

    @GetMapping("/{id}")
    public ResponseEntity<FichePosteResponse> getFicheById(@PathVariable Long id) {
        return ResponseEntity.ok(fichePosteService.getFicheById(id));
    }

    @GetMapping("/statut/{statut}")
    public ResponseEntity<List<FichePosteResponse>> getFichesByStatut(@PathVariable String statut) {
        return ResponseEntity.ok(fichePosteService.getFichesByStatut(statut));
    }

    @GetMapping("/recherche")
    public ResponseEntity<List<FichePosteResponse>> searchFiches(@RequestParam String titre) {
        return ResponseEntity.ok(fichePosteService.searchFiches(titre));
    }

    @PostMapping
    public ResponseEntity<FichePosteResponse> createFiche(
            @Valid @RequestBody FichePosteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(fichePosteService.createFiche(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FichePosteResponse> updateFiche(
            @PathVariable Long id,
            @Valid @RequestBody FichePosteRequest request) {
        return ResponseEntity.ok(fichePosteService.updateFiche(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFiche(@PathVariable Long id) {
        fichePosteService.deleteFiche(id);
        return ResponseEntity.noContent().build();
    }

    // ===== ENDPOINTS PUBLICS POUR LES CANDIDATS =====

    @GetMapping("/public/jobs")
    public ResponseEntity<List<FichePosteResponse>> getPublicJobs() {
        return ResponseEntity.ok(fichePosteService.getFichesByStatut("OUVERT"));
    }
}