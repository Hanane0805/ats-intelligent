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
    private final RagSourcingService ragSourcingService;
    private final Tika tika;

    @Value("${rag.python.service.url:http://localhost:5000}")
    private String pythonServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public DocumentCVService(DocumentCVRepository documentCVRepository,
                             CandidatRepository candidatRepository,
                             CVChunkRepository cvChunkRepository,
                             RagSourcingService ragSourcingService) {
        this.documentCVRepository = documentCVRepository;
        this.candidatRepository = candidatRepository;
        this.cvChunkRepository = cvChunkRepository;
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
        CandidatExtractionResponse extraction = tryExtractWithPython(texteBrut, file.getOriginalFilename());
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
            ragSourcingService.embedCandidateCV(candidat.getId(), document.getTexteBrut());
            System.out.println("[RAG-Document] Embedding Python effectue pour candidat " + candidat.getId());
        } catch (Exception e) {
            System.err.println("[RAG-Document] Erreur embedding Python: " + e.getMessage());
        }

        return toResponse(document);
    }

    private CandidatExtractionResponse tryExtractWithPython(String texteBrut, String filename) {
        try {
            String limitedText = texteBrut.length() > 3000 ? texteBrut.substring(0, 3000) : texteBrut;

            Map<String, String> requestBody = new LinkedHashMap<>();
            requestBody.put("text", limitedText);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, String>> request = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    pythonServiceUrl + "/api/rag/extract",
                    HttpMethod.POST, request, Map.class
            );

            Map<String, Object> data = response.getBody();
            if (data != null) {
                CandidatExtractionResponse result = new CandidatExtractionResponse();
                result.setNom(data.get("nom") != null ? data.get("nom").toString() : null);
                result.setPrenom(data.get("prenom") != null ? data.get("prenom").toString() : null);
                result.setEmail(data.get("email") != null ? data.get("email").toString() : null);

                if (result.getNom() != null || result.getPrenom() != null ||
                        (result.getEmail() != null && !result.getEmail().isEmpty())) {
                    return result;
                }
            }
        } catch (Exception e) {
            System.err.println("[CV Analysis] Python service indisponible, fallback regex: " + e.getMessage());
        }
        return extractWithSimpleSearch(texteBrut, filename);
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