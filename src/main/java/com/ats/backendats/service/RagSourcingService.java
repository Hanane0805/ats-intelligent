package com.ats.backendats.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class RagSourcingService {

    @Value("${rag.python.service.url:http://localhost:5000}")
    private String pythonServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public void embedCandidateCV(Long candidatId, String cvText) {
        log.info("Embedding CV pour candidat ID: {} (delegue au Python)", candidatId);
        try {
            String url = pythonServiceUrl + "/api/rag/embed";

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("candidat_id", candidatId);
            body.put("cv_text", cvText);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            restTemplate.exchange(url, HttpMethod.POST, request, String.class);
            log.info("CV embedde avec succes pour candidat ID: {}", candidatId);
        } catch (Exception e) {
            log.error("Erreur embedding CV candidat {}: {}", candidatId, e.getMessage());
        }
    }

    public List<Map<String, Object>> semanticSearch(String query, int topK) {
        log.info("Recherche semantique: '{}' | topK: {}", query, topK);
        try {
            String url = pythonServiceUrl + "/api/rag/search";

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("query", query);
            body.put("top_k", topK);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.POST, request, String.class);

            JsonNode root = objectMapper.readTree(response.getBody());
            List<Map<String, Object>> results = new ArrayList<>();
            if (root.isArray()) {
                for (JsonNode item : root) {
                    Map<String, Object> r = new LinkedHashMap<>();
                    r.put("candidatId", item.path("candidat_id").asLong());
                    r.put("score", item.path("score").asDouble());
                    results.add(r);
                }
            }
            log.info("{} candidats trouves", results.size());
            return results;

        } catch (Exception e) {
            log.error("Erreur recherche semantique: {}", e.getMessage());
            return List.of();
        }
    }
}