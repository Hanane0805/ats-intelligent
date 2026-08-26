package com.ats.backendats.controller;

import com.ats.backendats.service.FlaskAiService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Controller qui expose les endpoints d'analyse IA.
 * Delegue au FlaskAiService qui appelle le microservice Flask.
 */
@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class AiAnalyseController {

    private static final Logger log = LoggerFactory.getLogger(AiAnalyseController.class);

    private final FlaskAiService flaskAiService;

    public AiAnalyseController(FlaskAiService flaskAiService) {
        this.flaskAiService = flaskAiService;
    }

    /**
     * GET /api/ai/health
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> result = new LinkedHashMap<>();
        boolean healthy = flaskAiService.isHealthy();
        result.put("flask_service", healthy ? "available" : "unavailable");
        result.put("status", healthy ? "ok" : "error");
        return ResponseEntity.ok(result);
    }

    /**
     * POST /api/ai/extract
     */
    @PostMapping("/extract")
    public ResponseEntity<?> extractInfo(@RequestBody Map<String, String> request) {
        String cvText = request.get("cvText");

        if (cvText == null || cvText.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "cvText est requis"));
        }

        try {
            Map<String, Object> result = flaskAiService.extractCvInfo(cvText);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Erreur extraction: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/ai/analyze
     */
    @PostMapping("/analyze")
    public ResponseEntity<?> analyzeCv(@RequestBody Map<String, String> request) {
        String cvText = request.get("cvText");
        String jobDescription = request.get("jobDescription");

        if (cvText == null || cvText.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "cvText est requis"));
        }

        try {
            Map<String, Object> result;
            if (jobDescription != null && !jobDescription.isBlank()) {
                result = flaskAiService.analyzeCvWithJob(cvText, jobDescription);
            } else {
                result = flaskAiService.analyzeCv(cvText);
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Erreur analyse: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/ai/compatibility
     */
    @PostMapping("/compatibility")
    public ResponseEntity<?> compatibility(@RequestBody Map<String, String> request) {
        String cvText = request.get("cvText");
        String jobDescription = request.get("jobDescription");

        if (cvText == null || cvText.isBlank() || jobDescription == null || jobDescription.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "cvText et jobDescription sont requis"));
        }

        try {
            Map<String, Object> result = flaskAiService.computeCompatibility(cvText, jobDescription);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Erreur compatibilite: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/ai/full-analysis
     * Analyse classique (3 appels séparés).
     */
    @PostMapping("/full-analysis")
    public ResponseEntity<?> fullAnalysis(@RequestBody Map<String, String> request) {
        String cvText = request.get("cvText");
        String jobDescription = request.get("jobDescription");

        if (cvText == null || cvText.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "cvText est requis"));
        }

        try {
            Map<String, Object> result = flaskAiService.fullAnalysis(cvText, jobDescription);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Erreur analyse complete: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // ============================================================
    // ENDPOINT RAG - Pipeline complet en 1 appel
    // ============================================================

    /**
     * POST /api/ai/analyze-rag
     * Pipeline RAG complet : BERT + Heuristiques + RAG Retrieval + LLM
     * Score combine (BERT 40% + Heuristiques 30% + LLM 30%)
     *
     * Body: {
     *   "cvText": "...",
     *   "jobDescription": "...",  (optionnel)
     *   "candidatId": "6"         (optionnel, pour le RAG retrieval)
     * }
     */
    @PostMapping("/analyze-rag")
    public ResponseEntity<?> analyzeRag(@RequestBody Map<String, String> request) {
        String cvText = request.get("cvText");
        String jobDescription = request.get("jobDescription");
        String candidatId = request.get("candidatId");

        if (cvText == null || cvText.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "cvText est requis"));
        }

        try {
            Map<String, Object> result = flaskAiService.analyzeRag(
                    cvText, jobDescription, candidatId
            );
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Erreur analyse RAG: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}