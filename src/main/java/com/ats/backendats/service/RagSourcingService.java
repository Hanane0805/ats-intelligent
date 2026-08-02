package com.ats.backendats.service;

import com.ats.backendats.model.Candidat;
import com.ats.backendats.model.DocumentCV;
import com.ats.backendats.repository.CandidatRepository;
import com.ats.backendats.repository.DocumentCVRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RagSourcingService {

    private final VectorSearchService vectorSearchService;
    private final EmbeddingService embeddingService;
    private final CVSectionChunker cvSectionChunker;
    private final CandidatRepository candidatRepository;
    private final DocumentCVRepository documentCVRepository;

    public void embedCandidateCV(Candidat candidat, DocumentCV cv) {
        log.info("Embedding CV for candidate ID: {}", candidat.getId());
        try {
            String text = cv.getTexteBrut();
            if (text == null || text.isBlank()) {
                log.warn("CV vide pour candidat {}", candidat.getId());
                return;
            }

            List<CVSectionChunker.CVChunk> chunks = cvSectionChunker.chunk(text);
            List<String> chunkTexts = chunks.stream()
                    .map(CVSectionChunker.CVChunk::toEmbeddingText)
                    .collect(Collectors.toList());

            float[][] embeddings = embeddingService.embedBatch(chunkTexts);

            vectorSearchService.storeEmbeddings(candidat.getId(), chunkTexts, embeddings);

            log.info("CV embedde avec succes pour candidat ID: {} ({} sections)", candidat.getId(), chunks.size());
        } catch (Exception e) {
            log.error("Erreur embedding CV candidat {}", candidat.getId(), e);
        }
    }

    public List<Candidat> semanticSearch(String query, int topK) {
        log.info("Recherche semantique: '{}', topK: {}", query, topK);

        try {
            float[] queryEmbedding = embeddingService.embed(query);

            List<VectorSearchService.GlobalRetrievalResult> results =
                    vectorSearchService.searchGlobal(queryEmbedding, topK);

            List<Long> candidatIds = results.stream()
                    .map(VectorSearchService.GlobalRetrievalResult::candidatId)
                    .filter(id -> id != null)
                    .distinct()
                    .collect(Collectors.toList());

            log.info("{} candidats trouves pour la recherche", candidatIds.size());

            return candidatIds.stream()
                    .map(candidatRepository::findById)
                    .filter(Optional::isPresent)
                    .map(Optional::get)
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Erreur recherche semantique: {}", e.getMessage());
            return List.of();
        }
    }

    public int embedAllExistingCVs() {
        log.info("Embedding en lot de tous les CVs...");
        List<Candidat> candidats = candidatRepository.findAll();
        int count = 0;

        for (Candidat c : candidats) {
            List<DocumentCV> cvs = documentCVRepository.findByCandidatId(c.getId());
            if (!cvs.isEmpty() && cvs.get(0).getTexteBrut() != null) {
                embedCandidateCV(c, cvs.get(0));
                count++;
            }
        }

        log.info("{} CVs embeddes avec succes", count);
        return count;
    }
}