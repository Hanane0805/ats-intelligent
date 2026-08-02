package com.ats.backendats.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * VectorSearchService - Etapes 3 et 4 du pipeline RAG
 *
 * Etape 3 - Stockage : Stocke les embeddings des sections CV dans PgVector
 * Etape 4 - Retrieval : Cherche les sections les plus pertinentes par similarite cosinus
 */
@Service
public class VectorSearchService {

    private final JdbcTemplate jdbcTemplate;

    public VectorSearchService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
        initTable();
    }

    private void initTable() {
        try {
            jdbcTemplate.execute("CREATE EXTENSION IF NOT EXISTS vector;");

            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS cv_embeddings (
                    id BIGSERIAL PRIMARY KEY,
                    candidat_id BIGINT NOT NULL,
                    section_type VARCHAR(50),
                    chunk_index INTEGER NOT NULL,
                    content TEXT NOT NULL,
                    embedding vector(384),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                """);

            jdbcTemplate.execute("""
                CREATE INDEX IF NOT EXISTS idx_cv_emb_candidat 
                ON cv_embeddings(candidat_id);
                """);

            jdbcTemplate.execute("""
                CREATE INDEX IF NOT EXISTS idx_cv_emb_section 
                ON cv_embeddings(section_type);
                """);

            System.out.println("[RAG-VectorDB] Table cv_embeddings prete");
        } catch (Exception e) {
            System.err.println("[RAG-VectorDB] Erreur init: " + e.getMessage());
        }
    }

    public void storeEmbeddings(Long candidatId, List<String> chunks, float[][] embeddings) {
        jdbcTemplate.update("DELETE FROM cv_embeddings WHERE candidat_id = ?", candidatId);

        for (int i = 0; i < chunks.size(); i++) {
            String vectorStr = floatArrayToPgVector(embeddings[i]);
            String sectionType = extractSectionType(chunks.get(i));
            String content = chunks.get(i);

            jdbcTemplate.update(
                    "INSERT INTO cv_embeddings (candidat_id, section_type, chunk_index, content, embedding) VALUES (?, ?, ?, ?, ?::vector)",
                    candidatId, sectionType, i, content, vectorStr
            );
        }

        System.out.println("[RAG-VectorDB] " + chunks.size() + " sections stockees pour candidat " + candidatId);
    }

    private String extractSectionType(String enrichedText) {
        if (enrichedText.startsWith("[Section: ")) {
            int end = enrichedText.indexOf("]");
            if (end > 0) {
                return enrichedText.substring(10, end).trim();
            }
        }
        return "GENERAL";
    }

    /**
     * Recherche les sections les plus pertinentes pour UN candidat specifique.
     */
    public List<RetrievalResult> search(float[] queryEmbedding, Long candidatId, int topK) {
        String vectorStr = floatArrayToPgVector(queryEmbedding);

        String sql = """
            SELECT content, chunk_index, section_type,
                   1 - (embedding <=> ?::vector) AS similarity
            FROM cv_embeddings
            WHERE candidat_id = ?
            ORDER BY embedding <=> ?::vector
            LIMIT ?
            """;

        return jdbcTemplate.query(sql,
                (rs, rowNum) -> new RetrievalResult(
                        rs.getString("content"),
                        rs.getInt("chunk_index"),
                        rs.getString("section_type"),
                        rs.getDouble("similarity")
                ),
                vectorStr, candidatId, vectorStr, topK
        );
    }

    /**
     * Recherche globale sur TOUS les candidats (pour le sourcing).
     * Retourne les candidats dont les sections CV correspondent le mieux a la requete.
     */
    public List<GlobalRetrievalResult> searchGlobal(float[] queryEmbedding, int topK) {
        String vectorStr = floatArrayToPgVector(queryEmbedding);

        String sql = """
            SELECT candidat_id, section_type, content, chunk_index,
                   1 - (embedding <=> ?::vector) AS similarity
            FROM cv_embeddings
            ORDER BY embedding <=> ?::vector
            LIMIT ?
            """;

        return jdbcTemplate.query(sql,
                (rs, rowNum) -> new GlobalRetrievalResult(
                        rs.getLong("candidat_id"),
                        rs.getString("section_type"),
                        rs.getString("content"),
                        rs.getInt("chunk_index"),
                        rs.getDouble("similarity")
                ),
                vectorStr, vectorStr, topK
        );
    }

    public boolean hasEmbeddings(Long candidatId) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM cv_embeddings WHERE candidat_id = ?",
                Integer.class, candidatId
        );
        return count != null && count > 0;
    }

    private String floatArrayToPgVector(float[] vector) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < vector.length; i++) {
            if (i > 0) sb.append(",");
            sb.append(vector[i]);
        }
        sb.append("]");
        return sb.toString();
    }

    public static double cosineSimilarity(float[] a, float[] b) {
        double dotProduct = 0.0;
        double normA = 0.0;
        double normB = 0.0;
        for (int i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        if (normA == 0 || normB == 0) return 0.0;
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    public record RetrievalResult(
            String content,
            int chunkIndex,
            String sectionType,
            double similarity
    ) {}

    public record GlobalRetrievalResult(
            Long candidatId,
            String sectionType,
            String content,
            int chunkIndex,
            double similarity
    ) {}
}