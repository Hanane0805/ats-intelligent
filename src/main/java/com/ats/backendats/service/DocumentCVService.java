package com.ats.backendats.service;

import com.ats.backendats.dto.response.CandidatExtractionResponse;
import com.ats.backendats.dto.response.DocumentCVResponse;
import com.ats.backendats.exception.BadRequestException;
import com.ats.backendats.exception.ResourceNotFoundException;
import com.ats.backendats.model.Candidat;
import com.ats.backendats.model.DocumentCV;
import com.ats.backendats.repository.CandidatRepository;
import com.ats.backendats.repository.CVChunkRepository;
import com.ats.backendats.repository.DocumentCVRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.tika.Tika;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DocumentCVService {

    private final DocumentCVRepository documentCVRepository;
    private final CandidatRepository candidatRepository;
    private final CVChunkRepository cvChunkRepository;
    private final CVSectionChunker cvSectionChunker;
    private final EmbeddingService embeddingService;
    private final RagSourcingService ragSourcingService;
    private final Tika tika;

    @Value("${rag.gemini.api-key:}")
    private String geminiApiKey;

    @Value("${rag.gemini.model:gemini-1.5-flash}")
    private String geminiModel;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public DocumentCVService(DocumentCVRepository documentCVRepository,
                             CandidatRepository candidatRepository,
                             CVChunkRepository cvChunkRepository,
                             CVSectionChunker cvSectionChunker,
                             EmbeddingService embeddingService,
                             RagSourcingService ragSourcingService) {
        this.documentCVRepository = documentCVRepository;
        this.candidatRepository = candidatRepository;
        this.cvChunkRepository = cvChunkRepository;
        this.cvSectionChunker = cvSectionChunker;
        this.embeddingService = embeddingService;
        this.ragSourcingService = ragSourcingService;
        this.tika = new Tika();
    }

    public List<DocumentCVResponse> getAllDocuments() {
        return documentCVRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<DocumentCVResponse> getDocumentsByCandidat(Long candidatId) {
        return documentCVRepository.findByCandidatId(candidatId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public DocumentCVResponse getDocumentById(Long id) {
        DocumentCV doc = documentCVRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document CV non trouve avec l'ID : " + id));
        return toResponse(doc);
    }

    @Transactional
    public DocumentCVResponse uploadDocument(Long candidatId, MultipartFile file) {
        Candidat candidat = candidatRepository.findById(candidatId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidat non trouve avec l'ID : " + candidatId));
        if (file.isEmpty()) {
            throw new BadRequestException("Le fichier est vide");
        }
        return processAndSaveDocument(candidat, file);
    }

    public DocumentCVResponse analyzeAndCreateCandidate(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BadRequestException("Le fichier est vide");
        }
        String texteBrut;
        try {
            texteBrut = tika.parseToString(file.getInputStream());
            if (texteBrut == null || texteBrut.trim().isEmpty()) {
                texteBrut = "";
            }
        } catch (Exception e) {
            throw new BadRequestException("Erreur lors de la lecture du fichier : " + e.getMessage());
        }
        CandidatExtractionResponse extraction = tryExtractWithGemini(texteBrut, file.getOriginalFilename());
        return saveCandidatAndDocument(extraction, texteBrut, file.getOriginalFilename());
    }

    @Transactional
    public DocumentCVResponse saveCandidatAndDocument(CandidatExtractionResponse extraction, String texteBrut, String filename) {
        Optional<Candidat> existingCandidat = (extraction.getEmail() != null && !extraction.getEmail().isEmpty())
                ? candidatRepository.findByEmail(extraction.getEmail())
                : Optional.empty();

        Candidat candidat;
        if (existingCandidat.isPresent()) {
            candidat = existingCandidat.get();
            if (extraction.getNom() != null) candidat.setNom(extraction.getNom());
            if (extraction.getPrenom() != null) candidat.setPrenom(extraction.getPrenom());
            candidat = candidatRepository.save(candidat);
        } else {
            candidat = new Candidat();
            candidat.setNom(extraction.getNom() != null ? extraction.getNom() : "Candidat");
            candidat.setPrenom(extraction.getPrenom() != null ? extraction.getPrenom() : "Import");
            String email = (extraction.getEmail() != null && !extraction.getEmail().isEmpty())
                    ? extraction.getEmail()
                    : "candidat-" + System.currentTimeMillis() + "@import.local";
            candidat.setEmail(email);
            candidat = candidatRepository.save(candidat);
        }

        DocumentCV document = new DocumentCV();
        document.setCandidat(candidat);
        document.setNomFichier(filename);
        document.setDateUpload(LocalDate.now());
        document.setTexteBrut(texteBrut);
        document = documentCVRepository.save(document);

        try {
            List<CVSectionChunker.CVChunk> cvChunks = cvSectionChunker.chunk(texteBrut);
            int globalIndex = 0;
            for (CVSectionChunker.CVChunk cvChunk : cvChunks) {
                float[] embedding = embeddingService.embed(cvChunk.toEmbeddingText());
                com.ats.backendats.model.CVChunk relationalChunk = new com.ats.backendats.model.CVChunk();
                relationalChunk.setContenuTexte(cvChunk.content());
                relationalChunk.setVecteurEmbedding(embedding);
                relationalChunk.setIndexOrdre(globalIndex);
                relationalChunk.setDocumentCV(document);
                cvChunkRepository.save(relationalChunk);
                globalIndex++;
            }
            System.out.println("[RAG-Document] " + cvChunks.size() + " chunks CV-aware crees pour candidat " + candidat.getId());
        } catch (Exception e) {
            System.err.println("[RAG-Document] Erreur chunks: " + e.getMessage());
        }

        try {
            ragSourcingService.embedCandidateCV(candidat, document);
        } catch (Exception e) {
            System.err.println("[RAG-Document] Erreur PgVector: " + e.getMessage());
        }

        return toResponse(document);
    }

    private CandidatExtractionResponse tryExtractWithGemini(String texteBrut, String filename) {
        try {
            String limitedText = texteBrut.length() > 3000 ? texteBrut.substring(0, 3000) : texteBrut;

            String prompt = "Tu es un assistant de recrutement. Extrait les informations personnelles du candidat."
                    + " Si une information n'est pas trouvee, laisse le champ vide."
                    + "\n\nCV:\n" + limitedText
                    + "\n\nReponds UNIQUEMENT en JSON valide :"
                    + "\n{\"nom\": \"<nom>\", \"prenom\": \"<prenom>\", \"email\": \"<email>\", \"telephone\": \"<telephone>\", \"adresse\": \"<adresse>\"}";

            String response = callGemini(prompt);

            CandidatExtractionResponse result = new CandidatExtractionResponse();
            result.setNom(extractJsonStringField(response, "nom"));
            result.setPrenom(extractJsonStringField(response, "prenom"));
            result.setEmail(extractJsonStringField(response, "email"));



            if (result.getNom() != null || result.getPrenom() != null ||
                    (result.getEmail() != null && !result.getEmail().isEmpty())) {
                return result;
            }
        } catch (Exception e) {
            System.err.println("[CV Analysis] Gemini indisponible, fallback regex: " + e.getMessage());
        }
        return extractWithSimpleSearch(texteBrut, filename);
    }

    private String callGemini(String prompt) throws Exception {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/"
                + geminiModel + ":generateContent?key=" + geminiApiKey;

        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("contents", List.of(
                Map.of("parts", List.of(Map.of("text", prompt)))
        ));
        requestBody.put("generationConfig", Map.of(
                "temperature", 0.1,
                "maxOutputTokens", 512
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

        int backtickIdx = text.indexOf("```");
        if (backtickIdx >= 0) {
            int contentStart = text.indexOf("\n", backtickIdx);
            if (contentStart >= 0) {
                int contentEnd = text.indexOf("```", contentStart);
                if (contentEnd < 0) contentEnd = text.length();
                text = text.substring(contentStart, contentEnd).trim();
            }
        }
        return text;
    }

    private String extractJsonStringField(String json, String fieldName) {
        if (json == null) return null;
        String searchKey = "\"" + fieldName + "\":";
        int idx = json.indexOf(searchKey);
        if (idx < 0) return null;
        int startQuote = json.indexOf("\"", idx + searchKey.length());
        if (startQuote < 0) return null;
        int end = startQuote + 1;
        while (end < json.length()) {
            char c = json.charAt(end);
            if (c == '\\' && end + 1 < json.length()) {
                end += 2;
                continue;
            }
            if (c == '"') break;
            end++;
        }
        String value = json.substring(startQuote + 1, end);
        value = value.replace("\\n", " ").replace("\\t", " ");
        if (value.trim().isEmpty()) return null;
        return value;
    }

    private CandidatExtractionResponse extractWithSimpleSearch(String texteBrut, String filename) {
        CandidatExtractionResponse result = new CandidatExtractionResponse();

        int atIdx = texteBrut.indexOf("@");
        if (atIdx > 0) {
            int start = atIdx - 1;
            while (start > 0) {
                char c = texteBrut.charAt(start - 1);
                if (c == ' ' || c == '\n' || c == '\r' || c == '<' || c == '>') break;
                start--;
            }
            int end = atIdx + 1;
            while (end < texteBrut.length()) {
                char c = texteBrut.charAt(end);
                if (c == ' ' || c == '\n' || c == '\r' || c == '<' || c == '>' || c == ',') break;
                end++;
            }
            result.setEmail(texteBrut.substring(start, end));
        }

        if (filename != null) {
            String base = filename.replace(".pdf", "").replace(".doc", "").replace(".docx", "")
                    .replace("_", " ").replace("-", " ").trim();
            base = base.toLowerCase().replace("cv", "").replace("resume", "")
                    .replace("curriculum", "").replace("vitae", "").trim();
            String[] parts = base.split(" ");
            String[] nameParts = new String[2];
            int nameCount = 0;
            for (String part : parts) {
                if (part.length() > 1 && nameCount < 2) {
                    nameParts[nameCount] = part;
                    nameCount++;
                }
            }
            if (nameCount >= 2) {
                result.setPrenom(nameParts[0]);
                result.setNom(nameParts[1]);
            } else if (nameCount == 1) {
                result.setNom(nameParts[0]);
                result.setPrenom("Import");
            }
        }
        return result;
    }

    private DocumentCVResponse processAndSaveDocument(Candidat candidat, MultipartFile file) {
        DocumentCV document = new DocumentCV();
        document.setCandidat(candidat);
        document.setNomFichier(file.getOriginalFilename());
        document.setDateUpload(LocalDate.now());
        try {
            document.setTexteBrut(tika.parseToString(file.getInputStream()));
        } catch (Exception e) {
            throw new BadRequestException("Erreur lors de la lecture du fichier : " + e.getMessage());
        }
        document = documentCVRepository.save(document);
        return toResponse(document);
    }

    @Transactional
    public void deleteDocument(Long id) {
        if (!documentCVRepository.existsById(id)) {
            throw new ResourceNotFoundException("Document CV non trouve avec l'ID : " + id);
        }
        documentCVRepository.deleteById(id);
    }

    private DocumentCVResponse toResponse(DocumentCV d) {
        int nbChunks = cvChunkRepository.findByDocumentCVId(d.getId()).size();
        return DocumentCVResponse.builder()
                .id(d.getId())
                .nomFichier(d.getNomFichier())
                .cheminStockage(d.getCheminStockage())
                .texteBrut(d.getTexteBrut())
                .dateUpload(d.getDateUpload())
                .candidatId(d.getCandidat() != null ? d.getCandidat().getId() : null)
                .candidatNom(d.getCandidat() != null ? d.getCandidat().getNom() + " " + d.getCandidat().getPrenom() : null)
                .nombreChunks(nbChunks)
                .build();
    }
}