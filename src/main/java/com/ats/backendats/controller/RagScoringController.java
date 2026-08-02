package com.ats.backendats.controller;

import com.ats.backendats.service.RagScoringService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * RagScoringController - Endpoints REST pour le scoring RAG
 *
 * Pipeline RAG complet en Java :
 * Chunking -> Embedding (HuggingFace) -> PgVector -> Retrieval -> Gemini
 */
@RestController
@RequestMapping("/api/rag")
@CrossOrigin(origins = "*")
public class RagScoringController {

    private final RagScoringService ragScoringService;

    public RagScoringController(RagScoringService ragScoringService) {
        this.ragScoringService = ragScoringService;
    }

    @PostMapping("/score")
    public ResponseEntity<?> scoreCandidature(@RequestBody ScoreRequest request) {
        try {
            Map<String, Object> result = ragScoringService.scoreWithRAG(
                    request.candidatId(),
                    request.candidatNom(),
                    request.fichePosteId(),
                    request.posteTitre(),
                    request.cvText(),
                    request.jobDescription()
            );
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of(
                "status", "OK",
                "pipeline", "RAG pur (HuggingFace + PgVector + Gemini)",
                "steps", java.util.List.of(
                        "1. Chunking CV-Aware (Java)",
                        "2. Embedding (HuggingFace API)",
                        "3. Stockage (PgVector)",
                        "4. Retrieval (Cosine Similarity)",
                        "5. Generation (Gemini API)"
                )
        ));
    }

    public record ScoreRequest(
            Long candidatId,
            String candidatNom,
            String cvText,
            Long fichePosteId,
            String posteTitre,
            String jobDescription
    ) {}
}
