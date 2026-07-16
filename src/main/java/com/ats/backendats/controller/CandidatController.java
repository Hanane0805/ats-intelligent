package com.ats.backendats.controller;

import com.ats.backendats.dto.request.RegisterCandidatRequest;
import com.ats.backendats.dto.response.CandidatResponse;
import com.ats.backendats.service.CandidatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/candidats")
@RequiredArgsConstructor
public class CandidatController {

    private final CandidatService candidatService;

    @GetMapping
    public ResponseEntity<List<CandidatResponse>> getAllCandidats() {
        return ResponseEntity.ok(candidatService.getAllCandidats());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CandidatResponse> getCandidatById(@PathVariable Long id) {
        return ResponseEntity.ok(candidatService.getCandidatById(id));
    }

    @PostMapping
    public ResponseEntity<CandidatResponse> createCandidat(
            @Valid @RequestBody RegisterCandidatRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(candidatService.createCandidat(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CandidatResponse> updateCandidat(
            @PathVariable Long id,
            @Valid @RequestBody RegisterCandidatRequest request) {
        return ResponseEntity.ok(candidatService.updateCandidat(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCandidat(@PathVariable Long id) {
        candidatService.deleteCandidat(id);
        return ResponseEntity.noContent().build();
    }
}