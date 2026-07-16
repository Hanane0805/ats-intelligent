package com.ats.backendats.controller;

import com.ats.backendats.dto.request.CandidatureRequest;
import com.ats.backendats.dto.request.CandidatureUpdateRequest;
import com.ats.backendats.dto.response.CandidatureResponse;
import com.ats.backendats.service.CandidatureService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/candidatures")
@RequiredArgsConstructor
public class CandidatureController {

    private final CandidatureService candidatureService;

    @GetMapping
    public ResponseEntity<List<CandidatureResponse>> getAllCandidatures() {
        return ResponseEntity.ok(candidatureService.getAllCandidatures());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CandidatureResponse> getCandidatureById(@PathVariable Long id) {
        return ResponseEntity.ok(candidatureService.getCandidatureById(id));
    }

    @GetMapping("/candidat/{candidatId}")
    public ResponseEntity<List<CandidatureResponse>> getCandidaturesByCandidat(
            @PathVariable Long candidatId) {
        return ResponseEntity.ok(candidatureService.getCandidaturesByCandidat(candidatId));
    }

    @GetMapping("/poste/{fichePosteId}")
    public ResponseEntity<List<CandidatureResponse>> getCandidaturesByPoste(
            @PathVariable Long fichePosteId) {
        return ResponseEntity.ok(candidatureService.getCandidaturesByPoste(fichePosteId));
    }

    @GetMapping("/statut/{statut}")
    public ResponseEntity<List<CandidatureResponse>> getCandidaturesByStatut(
            @PathVariable String statut) {
        return ResponseEntity.ok(candidatureService.getCandidaturesByStatut(statut));
    }

    @PostMapping
    public ResponseEntity<CandidatureResponse> createCandidature(
            @Valid @RequestBody CandidatureRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(candidatureService.createCandidature(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CandidatureResponse> updateCandidature(
            @PathVariable Long id,
            @Valid @RequestBody CandidatureUpdateRequest request) {
        return ResponseEntity.ok(candidatureService.updateCandidature(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCandidature(@PathVariable Long id) {
        candidatureService.deleteCandidature(id);
        return ResponseEntity.noContent().build();
    }
}