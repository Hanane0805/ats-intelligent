package com.ats.backendats.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;



import org.springframework.http.*;


import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * RagScoringService - Pipeline RAG complet pour le scoring CV vs Job
 *
 * Pipeline RAG avec chunking intelligent specifique aux CV :
 *
 *   1. CV-AWARE CHUNKING : Decompose le CV en sections (Profile, Experience, Formation, Skills, Langues...)
 *   2. EMBEDDING        : Vectorise chaque section (EmbeddingService + Google text-embedding-004)
 *   3. STOCKAGE         : Stocke dans PgVector avec le type de section (VectorSearchService)
 *   4. RETRIEVAL        : Cherche les sections pertinentes vs description du job (cosine similarity)
 *   5. GENERATION       : Appelle Gemini pour generer le score et l'analyse
 *
 * Le flux complet :
 *   CV texte --> sections CV --> embeddings --> PgVector --> retrieval --> Gemini --> score
 *                                                              job desc --> embedding ----^
 */
@Service
public class RagScoringService {

    @Value("${rag.gemini.api-key:}")
    private String geminiApiKey;

    @Value("${rag.gemini.model:gemini-1.5-flash}")
    private String geminiModel;

    private final CVSectionChunker cvSectionChunker;
    private final EmbeddingService embeddingService;
    private final VectorSearchService vectorSearchService;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public RagScoringService(CVSectionChunker cvSectionChunker,
                             EmbeddingService embeddingService,
                             VectorSearchService vectorSearchService) {
        this.cvSectionChunker = cvSectionChunker;
        this.embeddingService = embeddingService;
        this.vectorSearchService = vectorSearchService;
    }

    /**
     * Pipeline RAG complet pour scorer un candidat vs une fiche de poste.
     */
    public Map<String, Object> scoreWithRAG(Long candidatId, String candidatNom,
                                            Long fichePosteId, String posteTitre,
                                            String cvText, String jobDescription) {
        System.out.println("\n========== PIPELINE RAG (CV-Aware) ==========");
        System.out.println("[RAG] Candidat: " + candidatNom + " (" + candidatId + ")");
        System.out.println("[RAG] Poste: " + posteTitre + " (" + fichePosteId + ")");

        try {
            // ====== ETAPE 1 : CV-AWARE CHUNKING ======
            System.out.println("\n--- Etape 1: CV-AWARE CHUNKING ---");
            List<CVSectionChunker.CVChunk> cvChunks = cvSectionChunker.chunk(cvText);
            System.out.println("[RAG] " + cvChunks.size() + " sections CV identifiees");

            // Preparer les textes pour l'embedding (avec le type de section en prefixe)
            List<String> chunkTexts = cvChunks.stream()
                    .map(CVSectionChunker.CVChunk::toEmbeddingText)
                    .collect(Collectors.toList());

            // Limiter le CV pour la generation
            String limitedCvText = cvText.length() > 3000
                    ? cvText.substring(0, 3000) + "..." : cvText;

            // ====== ETAPE 2 : EMBEDDING des sections du CV ======
            System.out.println("\n--- Etape 2: EMBEDDING (Google text-embedding-004) ---");
            float[][] cvEmbeddings = embeddingService.embedBatch(chunkTexts);
            System.out.println("[RAG] " + cvEmbeddings.length + " embeddings generes (" + cvEmbeddings[0].length + " dims)");

            // ====== ETAPE 3 : STOCKAGE dans PgVector ======
            System.out.println("\n--- Etape 3: STOCKAGE PgVector ---");
            vectorSearchService.storeEmbeddings(candidatId, chunkTexts, cvEmbeddings);
            System.out.println("[RAG] Embeddings stockes avec types de section");

            // ====== ETAPE 2b : EMBEDDING de la description du job ======
            System.out.println("\n--- Etape 2b: EMBEDDING du Job ---");
            float[] jobEmbedding = embeddingService.embed(jobDescription);
            System.out.println("[RAG] Description du poste vectorisee");

            // ====== ETAPE 4 : RETRIEVAL - Sections les plus pertinentes ======
            System.out.println("\n--- Etape 4: RETRIEVAL (Cosine Similarity) ---");
            int topK = Math.min(5, cvChunks.size());
            List<VectorSearchService.RetrievalResult> retrievedChunks =
                    vectorSearchService.search(jobEmbedding, candidatId, topK);

            System.out.println("[RAG] " + retrievedChunks.size() + " sections pertinentes retrouvees:");
            for (VectorSearchService.RetrievalResult r : retrievedChunks) {
                System.out.println("  - Chunk " + r.chunkIndex() + " (similarite: " +
                        String.format("%.2f", r.similarity()) + "): " +
                        r.content().substring(0, Math.min(80, r.content().length())) + "...");
            }

            // ====== ETAPE 5 : GENERATION via Gemini ======
            System.out.println("\n--- Etape 5: GENERATION (Gemini) ---");

            // Construire le contexte RAG structure
            StringBuilder ragContext = new StringBuilder();
            for (int i = 0; i < retrievedChunks.size(); i++) {
                VectorSearchService.RetrievalResult r = retrievedChunks.get(i);
                ragContext.append("[Section retrouvee ").append(i + 1)
                        .append(" - Pertinence: ")
                        .append(String.format("%.0f%%", r.similarity() * 100))
                        .append("]\n").append(r.content()).append("\n\n");
            }

            // Extraire les sections CV structurees pour le prompt
            String cvStructured = buildCVSummary(cvChunks);

            // Score de similarite vectorielle moyen
            double avgSimilarity = retrievedChunks.stream()
                    .mapToDouble(VectorSearchService.RetrievalResult::similarity)
                    .average().orElse(0.0);

            // Construire le prompt avec le contexte RAG
            String prompt = buildCVScoringPrompt(ragContext.toString(), jobDescription, cvStructured);

            // Appeler Gemini API
            String geminiResponse;
            try {
                geminiResponse = callGeminiAPI(prompt);
            } catch (Exception e) {
                System.err.println("[RAG-Gemini] Erreur d'appel API, utilisation du fallback hors-ligne: " + e.getMessage());
                int fallbackScore = Math.max(10, Math.min(95, (int) Math.round(avgSimilarity * 100)));
                geminiResponse = """
                    {
                      "score": %d,
                      "analyse": "Attention: L'analyse détaillée en ligne n'a pas pu être effectuée car l'API de génération (Gemini) est inaccessible (Mode hors-ligne / fallback activé). Le score de %d/100 est calculé d'après la similarité sémantique des sections détectées dans votre CV par rapport au poste.",
                      "competencesMatch": ["RAG-Fallback (Sémantique)"],
                      "competencesManquantes": []
                    }
                    """.formatted(fallbackScore, fallbackScore);
            }

            // Extraire le score
            int score = extractScore(geminiResponse, avgSimilarity);

            System.out.println("[RAG] Score final: " + score + "/100");
            System.out.println("========== FIN PIPELINE RAG ==========\n");

            // Construire le resultat
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("candidatId", candidatId);
            result.put("candidatNom", candidatNom);
            result.put("fichePosteId", fichePosteId);
            result.put("posteTitre", posteTitre);
            result.put("score", score);
            result.put("ragDetails", Map.of(
                    "cvSections", cvChunks.stream().map(c -> Map.of(
                            "type", c.type(),
                            "length", c.content().length()
                    )).collect(Collectors.toList()),
                    "retrievedSections", retrievedChunks.size(),
                    "avgVectorSimilarity", Math.round(avgSimilarity * 100),
                    "embeddingModel", "Google text-embedding-004",
                    "generationModel", geminiModel
            ));
            result.put("rawResponse", geminiResponse);

            return result;

        } catch (Exception e) {
            System.err.println("[RAG] Erreur pipeline: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Erreur lors du scoring RAG: " + e.getMessage(), e);
        }
    }

    /**
     * Construit un resume structure du CV a partir des sections identifiees.
     * Ceci aide Gemini a voir clairement la structure du CV.
     */
    private String buildCVSummary(List<CVSectionChunker.CVChunk> chunks) {
        StringBuilder summary = new StringBuilder();
        for (CVSectionChunker.CVChunk chunk : chunks) {
            summary.append("=== ").append(chunk.type()).append(" ===\n");
            summary.append(chunk.content()).append("\n\n");
        }
        return summary.toString();
    }

    /**
     * Construit le prompt pour Gemini avec le contexte RAG structure par sections CV.
     */
    private String buildCVScoringPrompt(String ragContext, String jobDescription, String cvStructured) {
        return """
            Tu es un expert en recrutement IA. Analyse la compatibilite entre un candidat et une offre d'emploi.
            
            DESCRIPTION DU POSTE:
            ```
            %s
            ```
            
            SECTIONS DU CV LES PLUS PERTINENTES (retrieval RAG):
            ```
            %s
            ```
            
            CV COMPLET STRUCTURE DU CANDIDAT:
            ```
            %s
            ```
            
            INSTRUCTIONS:
            Analyse chaque section du CV (Experience, Formation, Skills, Langues) par rapport aux exigences du poste.
            Reponds UNIQUEMENT en JSON valide avec cette structure exacte :
            {
              "score": <nombre entier de 0 a 100>,
              "analyse": "<analyse detaillee de 3-4 phrases. Mentionne les points forts et faibles par section du CV>",
              "competencesMatch": ["<competence1>", "<competence2>", ...],
              "competencesManquantes": ["<competence1>", "<competence2>", ...]
            }
            
            Regles de scoring :
            - 80-100 : Toutes les competences cles sont presentes avec de l'experience solide
            - 60-79  : Bonne correspondance mais il manque quelques competences
            - 40-59  : Correspondance partielle, competences insuffisantes
            - 0-39   : Peu ou pas de correspondance avec le poste
            - competencesMatch: technologies/competences du candidat qui correspondent AU POSTE
            - competencesManquantes: competences demandees dans le poste mais absentes du CV
            """.formatted(jobDescription, ragContext, cvStructured);
    }

    /**
     * Appelle l'API Google Gemini pour la generation.
     */
    private String callGeminiAPI(String prompt) {
        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/"
                    + geminiModel + ":generateContent?key=" + geminiApiKey;

            Map<String, Object> requestBody = new LinkedHashMap<>();
            requestBody.put("contents", List.of(
                    Map.of("parts", List.of(Map.of("text", prompt)))
            ));
            requestBody.put("generationConfig", Map.of(
                    "temperature", 0.2,
                    "maxOutputTokens", 1024
            ));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.POST, request, String.class
            );

            JsonNode root = objectMapper.readTree(response.getBody());
            String text = root.path("candidates").get(0)
                    .path("content").path("parts").get(0)
                    .path("text").asText();

            System.out.println("[RAG-Gemini] Reponse obtenue: " + text.length() + " caracteres");
            return text;

        } catch (Exception e) {
            System.err.println("[RAG-Gemini] Erreur: " + e.getMessage());
            throw new RuntimeException("Erreur lors de l'appel a Gemini: " + e.getMessage(), e);
        }
    }

    /**
     * Extrait le score de la reponse JSON de Gemini.
     * Fallback sur la similarite vectorielle si l'extraction echoue.
     */
    private int extractScore(String response, double vectorSimilarity) {
        Pattern pattern = Pattern.compile("\"score\"\\s*:\\s*(\\d+)");
        Matcher matcher = pattern.matcher(response);
        if (matcher.find()) {
            int extractedScore = Integer.parseInt(matcher.group(1));
            return Math.max(0, Math.min(100, extractedScore));
        }
        int fallbackScore = (int) Math.round(vectorSimilarity * 100);
        System.out.println("[RAG] Score JSON echoue, score vectoriel: " + fallbackScore);
        return Math.max(0, Math.min(100, fallbackScore));
    }
}