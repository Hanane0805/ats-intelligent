package com.ats.backendats.service;
import com.ats.backendats.model.Candidat;
import com.ats.backendats.model.DocumentCV;
import com.ats.backendats.repository.CandidatRepository;
import com.ats.backendats.repository.DocumentCVRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RagSourcingService {

    private final VectorStore vectorStore;
    private final EmbeddingModel embeddingModel;
    private final CandidatRepository candidatRepository;
    private final DocumentCVRepository documentCVRepository;

    /**
     * Extracts text from CV and saves it to the vector store with metadata.
     */
    public void embedCandidateCV(Candidat candidat, DocumentCV cv) {
        log.info("Embedding CV for candidate ID: {}", candidat.getId());
        try {
            // Note: cv.getTexteBrut() contains the full text parsed by Tika
            String text = cv.getTexteBrut();
            if (text == null || text.isBlank()) {
                log.warn("Cannot embed CV for candidate {} - text is empty", candidat.getId());
                return;
            }

            // Create a Spring AI Document
            Document doc = new Document(text, Map.of(
                    "candidatId", candidat.getId(),
                    "prenom", candidat.getPrenom() != null ? candidat.getPrenom() : "",
                    "nom", candidat.getNom() != null ? candidat.getNom() : "",
                    "email", candidat.getEmail() != null ? candidat.getEmail() : ""
            ));

            // Generate embeddings and store in pgvector
            // Internally, this chunks the document if a text splitter is configured or stores it if it fits the token limit.
            vectorStore.add(List.of(doc));
            
            log.info("Successfully embedded CV for candidate ID: {}", candidat.getId());
        } catch (Exception e) {
            log.error("Failed to embed CV for candidate {}", candidat.getId(), e);
        }
    }

    /**
     * Performs a semantic search across all embedded CVs.
     * @param query The natural language search query.
     * @param topK Number of top results to return.
     * @return List of matched candidates.
     */
    public List<Candidat> semanticSearch(String query, int topK) {
        log.info("Performing semantic search for query: '{}', topK: {}", query, topK);
        
        SearchRequest request = SearchRequest.builder().query(query).topK(topK).build();
        List<Document> similarDocuments = vectorStore.similaritySearch(request);

        return similarDocuments.stream()
                .map(doc -> {
                    Object idObj = doc.getMetadata().get("candidatId");
                    if (idObj == null) return null;
                    Long candidatId = Long.valueOf(idObj.toString());
                    return candidatRepository.findById(candidatId).orElse(null);
                })
                .filter(c -> c != null)
                .distinct() // Remove duplicates if multiple chunks belonged to same CV
                .collect(Collectors.toList());
    }

    /**
     * Utility method to embed all existing CVs in the database.
     */
    public int embedAllExistingCVs() {
        log.info("Starting batch embedding of all existing CVs...");
        List<Candidat> candidats = candidatRepository.findAll();
        int count = 0;
        
        for (Candidat c : candidats) {
            List<DocumentCV> cvs = documentCVRepository.findByCandidatId(c.getId());
            if (!cvs.isEmpty() && cvs.get(0).getTexteBrut() != null) {
                embedCandidateCV(c, cvs.get(0));
                count++;
            }
        }
        
        log.info("Successfully embedded {} CVs", count);
        return count;
    }
}
