package com.ats.backendats.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class EmbeddingService {

    @Value("${rag.embedding.provider:gemini}")
    private String provider;

    @Value("${rag.gemini.api-key:}")
    private String geminiApiKey;

    @Value("${rag.gemini.embedding-model:gemini-embedding-001}")
    private String geminiEmbeddingModel;

    @Value("${rag.huggingface.api-key:}")
    private String hfApiKey;

    @Value("${rag.huggingface.model:sentence-transformers/all-MiniLM-L6-v2}")
    private String hfModel;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Map<String, float[]> embeddingCache = new HashMap<>();

    public float[] embed(String text) {
        String cacheKey = String.valueOf(text.trim().hashCode());
        if (embeddingCache.containsKey(cacheKey)) {
            return embeddingCache.get(cacheKey);
        }

        String primaryProvider = (provider != null && !provider.trim().isEmpty()) ? provider.trim().toLowerCase() : "gemini";
        String secondaryProvider = "gemini".equals(primaryProvider) ? "huggingface" : "gemini";

        try {
            // Tentative 1 avec le provider principal
            try {
                float[] embedding = embedDirect(text, primaryProvider);
                normalize(embedding);
                embeddingCache.put(cacheKey, embedding);
                System.out.println("[RAG-Embedding] Texte vectorise via " + primaryProvider + " (" + embedding.length + " dims)");
                return embedding;
            } catch (Exception e1) {
                System.err.println("[RAG-Embedding] Erreur avec le provider principal " + primaryProvider + ": " + e1.getMessage());
                // Tentative 2 avec le provider secondaire
                System.out.println("[RAG-Embedding] Tentative de repli sur le provider secondaire: " + secondaryProvider);
                float[] embedding = embedDirect(text, secondaryProvider);
                normalize(embedding);
                embeddingCache.put(cacheKey, embedding);
                System.out.println("[RAG-Embedding] Texte vectorise via repli " + secondaryProvider + " (" + embedding.length + " dims)");
                return embedding;
            }
        } catch (Exception e) {
            System.err.println("[RAG-Embedding] WARNING: Echec de tous les providers d'embedding en ligne: " + e.getMessage());
            System.err.println("[RAG-Embedding] Utilisation de l'embedding local deterministe hors-ligne.");
            float[] mockEmbedding = generateMockEmbedding(text, 384);
            embeddingCache.put(cacheKey, mockEmbedding);
            return mockEmbedding;
        }
    }

    public float[][] embedBatch(List<String> texts) {
        float[][] embeddings = new float[texts.size()][];
        for (int i = 0; i < texts.size(); i++) {
            embeddings[i] = embed(texts.get(i));
        }
        System.out.println("[RAG-Embedding] " + texts.size() + " textes vectorises en lot");
        return embeddings;
    }

    private float[] embedDirect(String text, String selectedProvider) throws Exception {
        if ("gemini".equalsIgnoreCase(selectedProvider)) {
            if (geminiApiKey == null || geminiApiKey.trim().isEmpty()) {
                throw new IllegalArgumentException("API Key Gemini manquante");
            }
            String url = "https://generativelanguage.googleapis.com/v1beta/models/" + geminiEmbeddingModel + ":embedContent?key=" + geminiApiKey;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> content = new LinkedHashMap<>();
            content.put("parts", List.of(Map.of("text", text)));

            Map<String, Object> requestBody = new LinkedHashMap<>();
            requestBody.put("model", "models/" + geminiEmbeddingModel);
            requestBody.put("content", content);
            requestBody.put("outputDimensionality", 384);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, request, String.class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("Google API Status Code: " + response.getStatusCode());
            }

            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode values = root.path("embedding").path("values");
            if (values.isMissingNode() || values.size() == 0) {
                throw new RuntimeException("Embedding values manquants dans la reponse Gemini");
            }

            float[] embedding = new float[values.size()];
            for (int i = 0; i < values.size(); i++) {
                embedding[i] = (float) values.get(i).asDouble();
            }
            return adjustDimension(embedding, 384);

        } else if ("huggingface".equalsIgnoreCase(selectedProvider)) {
            if (hfApiKey == null || hfApiKey.trim().isEmpty()) {
                throw new IllegalArgumentException("API Key Hugging Face manquante");
            }
            String url = "https://api-inference.huggingface.co/pipeline/feature-extraction/" + hfModel;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + hfApiKey.trim());

            Map<String, Object> requestBody = new LinkedHashMap<>();
            requestBody.put("inputs", text);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, request, String.class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("HuggingFace API Status Code: " + response.getStatusCode());
            }

            JsonNode root = objectMapper.readTree(response.getBody());
            float[] embedding = parseHuggingFaceResponse(root);
            return adjustDimension(embedding, 384);
        } else {
            throw new IllegalArgumentException("Provider inconnu: " + selectedProvider);
        }
    }

    private float[] parseHuggingFaceResponse(JsonNode node) {
        while (node.isArray() && node.size() > 0 && node.get(0).isArray()) {
            node = node.get(0);
        }
        if (node.isArray() && node.size() > 0) {
            float[] embedding = new float[node.size()];
            for (int i = 0; i < node.size(); i++) {
                embedding[i] = (float) node.get(i).asDouble();
            }
            return embedding;
        }
        throw new RuntimeException("Format de reponse Hugging Face inattendu (pas un tableau de nombres)");
    }

    private float[] adjustDimension(float[] embedding, int targetDimension) {
        if (embedding.length == targetDimension) {
            return embedding;
        }
        System.out.println("[RAG-Embedding] WARNING: Dimension de l'embedding obtenue (" + embedding.length + ") differe de " + targetDimension + ". Redimensionnement...");
        return Arrays.copyOf(embedding, targetDimension);
    }

    private float[] generateMockEmbedding(String text, int dimensions) {
        float[] vector = new float[dimensions];
        long seed = text.trim().hashCode();
        Random random = new Random(seed);
        for (int i = 0; i < dimensions; i++) {
            vector[i] = (float) random.nextGaussian();
        }
        normalize(vector);
        return vector;
    }

    private void normalize(float[] vector) {
        double norm = 0.0;
        for (float v : vector) {
            norm += v * v;
        }
        norm = Math.sqrt(norm);
        if (norm > 0) {
            for (int i = 0; i < vector.length; i++) {
                vector[i] /= norm;
            }
        }
    }
}