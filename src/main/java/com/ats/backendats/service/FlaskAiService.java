package com.ats.backendats.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * Service client qui appelle le microservice Flask (ats-rag-service).
 * Tous les appels IA (BERT, embeddings, scoring) passent par ici.
 */
@Service
public class FlaskAiService {

    private static final Logger log = LoggerFactory.getLogger(FlaskAiService.class);
    private static final ObjectMapper mapper = new ObjectMapper();

    @Value("${ats.flask.url:http://localhost:5000}")
    private String flaskUrl;

    private final RestTemplate restTemplate;

    public FlaskAiService() {
        this.restTemplate = new RestTemplate();
    }

    /**
     * Verifie si le service Flask est disponible.
     */
    public boolean isHealthy() {
        try {
            String url = flaskUrl + "/health";
            String response = restTemplate.getForObject(url, String.class);
            return response != null && response.contains("\"ok\"");
        } catch (Exception e) {
            log.warn("Flask service non disponible: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Analyse ATS d'un CV.
     * Appelle POST /api/rag/analyze
     *
     * @param cvText le texte du CV
     * @return Map avec tous les resultats (ats_score, points_forts, a_ameliorer, etc.)
     */
    public Map<String, Object> analyzeCv(String cvText) {
        try {
            String url = flaskUrl + "/api/rag/analyze";

            Map<String, String> request = new HashMap<>();
            request.put("cv_text", cvText);

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(url, request, Map.class);

            if (response == null) {
                throw new RuntimeException("Reponse null du service Flask");
            }

            log.info("Analyse CV - Score BERT: {}%, Heuristique: {}%",
                    response.get("ats_score"), response.get("heuristic_score"));

            return response;

        } catch (Exception e) {
            log.error("Erreur analyse CV via Flask: {}", e.getMessage());
            throw new RuntimeException("Service IA indisponible: " + e.getMessage());
        }
    }

    /**
     * Analyse ATS d'un CV avec comparaison a une offre d'emploi.
     * Appelle POST /api/rag/analyze avec job_description.
     */
    public Map<String, Object> analyzeCvWithJob(String cvText, String jobDescription) {
        try {
            String url = flaskUrl + "/api/rag/analyze";

            Map<String, String> request = new HashMap<>();
            request.put("cv_text", cvText);
            request.put("job_description", jobDescription);

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(url, request, Map.class);

            if (response == null) {
                throw new RuntimeException("Reponse null du service Flask");
            }

            return response;

        } catch (Exception e) {
            log.error("Erreur analyse CV+Job via Flask: {}", e.getMessage());
            throw new RuntimeException("Service IA indisponible: " + e.getMessage());
        }
    }

    /**
     * Calcule le score de compatibilite entre un CV et une offre.
     * Appelle POST /api/rag/compatibility
     */
    public Map<String, Object> computeCompatibility(String cvText, String jobDescription) {
        try {
            String url = flaskUrl + "/api/rag/compatibility";

            Map<String, String> request = new HashMap<>();
            request.put("cv_text", cvText);
            request.put("job_description", jobDescription);

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(url, request, Map.class);

            if (response == null) {
                throw new RuntimeException("Reponse null du service Flask");
            }

            log.info("Compatibilite CV-Job - Score total: {}%", response.get("total_score"));

            return response;

        } catch (Exception e) {
            log.error("Erreur compatibilite via Flask: {}", e.getMessage());
            throw new RuntimeException("Service IA indisponible: " + e.getMessage());
        }
    }

    /**
     * Extrait les informations cles d'un CV (email, tel, nom, skills).
     * Appelle POST /api/rag/extract
     */
    public Map<String, Object> extractCvInfo(String cvText) {
        try {
            String url = flaskUrl + "/api/rag/extract";

            Map<String, String> request = new HashMap<>();
            request.put("cv_text", cvText);

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(url, request, Map.class);

            if (response == null) {
                throw new RuntimeException("Reponse null du service Flask");
            }

            return response;

        } catch (Exception e) {
            log.error("Erreur extraction CV via Flask: {}", e.getMessage());
            throw new RuntimeException("Service IA indisponible: " + e.getMessage());
        }
    }

    /**
     * Analyse complete : extrait les infos + score ATS + compatibilite.
     * Combine les 3 appels Flask en une seule reponse.
     */
    public Map<String, Object> fullAnalysis(String cvText, String jobDescription) {
        Map<String, Object> result = new LinkedHashMap<>();

        // 1. Extraction des infos
        Map<String, Object> extraction = extractCvInfo(cvText);
        result.put("extraction", extraction);

        // 2. Analyse ATS
        Map<String, Object> analyse;
        if (jobDescription != null && !jobDescription.isBlank()) {
            analyse = analyzeCvWithJob(cvText, jobDescription);
        } else {
            analyse = analyzeCv(cvText);
        }
        result.put("analyse_ats", analyse);

        // 3. Compatibilite (seulement si offre fournie)
        if (jobDescription != null && !jobDescription.isBlank()) {
            Map<String, Object> compat = computeCompatibility(cvText, jobDescription);
            result.put("compatibilite", compat);
        }

        return result;
    }
}
