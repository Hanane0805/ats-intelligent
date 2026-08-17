package com.ats.backendats.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * RagScoringService - Appelle le service Python (Flask) pour le pipeline RAG
 *
 * Le pipeline RAG est maintenant execute par le microservice Python :
 *   1. Extraction texte (Apache Tika)
 *   2. Chunking intelligent par sections CV
 *   3. Embedding local (sentence-transformers)
 *   4. Stockage + recherche dans pgvector
 *   5. Classification ATS (BERT fine-tune)
 *   6. Generation de l'analyse
 */
@Service
@Slf4j
public class RagScoringService {

    @Value("${rag.python.service.url:http://localhost:5000}")
    private String pythonServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Pipeline RAG complet - delegue au service Python
     */
    public Map<String, Object> scoreWithRAG(Long candidatId, String candidatNom,
                                            Long fichePosteId, String posteTitre,
                                            String cvText, String jobDescription) {
        log.info("Pipeline RAG - Candidat: {} ({}) | Poste: {} ({})",
                candidatNom, candidatId, posteTitre, fichePosteId);

        try {
            // Appeler le service Python
            String url = pythonServiceUrl + "/api/rag/analyze";

            Map<String, Object> requestBody = new LinkedHashMap<>();
            requestBody.put("candidat_id", candidatId);
            requestBody.put("candidat_nom", candidatNom);
            requestBody.put("fiche_poste_id", fichePosteId);
            requestBody.put("poste_titre", posteTitre);
            requestBody.put("cv_text", cvText);
            requestBody.put("job_description", jobDescription);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.POST, request, String.class);

            // Parser la reponse Python
            JsonNode root = objectMapper.readTree(response.getBody());

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("candidatId", candidatId);
            result.put("candidatNom", candidatNom);
            result.put("fichePosteId", fichePosteId);
            result.put("posteTitre", posteTitre);
            result.put("score", root.path("score").asInt());
            result.put("ats_compliant", root.path("ats_compliant").asBoolean());
            result.put("ats_points", root.path("ats_points").toString());
            result.put("analyse", root.path("analyse").asText());
            result.put("competencesMatch", toStringList(root.path("competences_match")));
            result.put("competencesManquantes", toStringList(root.path("competences_manquantes")));
            result.put("ragDetails", Map.of(
                    "embeddingModel", "sentence-transformers (local)",
                    "generationModel", "BERT ATS Classifier (local)",
                    "source", "Python RAG Microservice"
            ));

            log.info("Score final: {}/100 | ATS: {}", result.get("score"), result.get("ats_compliant"));
            return result;

        } catch (Exception e) {
            log.warn("[RAG-Fallback] Microservice Python indisponible ({}). Retour d'un score par défaut.", e.getMessage());
            // Fallback : retourner un résultat par défaut pour ne pas bloquer l'application
            Map<String, Object> fallback = new LinkedHashMap<>();
            fallback.put("candidatId", candidatId);
            fallback.put("candidatNom", candidatNom);
            fallback.put("fichePosteId", fichePosteId);
            fallback.put("posteTitre", posteTitre);
            fallback.put("score", 0);
            fallback.put("ats_compliant", false);
            fallback.put("ats_points", "[]");
            fallback.put("analyse", "⚠️ Le microservice d'analyse IA (Python) est actuellement indisponible. Veuillez le démarrer pour obtenir une analyse complète.");
            fallback.put("competencesMatch", List.of());
            fallback.put("competencesManquantes", List.of());
            fallback.put("ragDetails", Map.of(
                    "source", "Fallback (Python service offline)",
                    "error", e.getMessage()
            ));
            return fallback;
        }
    }

    private List<String> toStringList(JsonNode node) {
        List<String> list = new ArrayList<>();
        if (node.isArray()) {
            for (JsonNode item : node) {
                list.add(item.asText());
            }
        }
        return list;
    }
}