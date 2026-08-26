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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DocumentCVService {

    private static final Logger log = LoggerFactory.getLogger(DocumentCVService.class);

    private final DocumentCVRepository documentCVRepository;
    private final CandidatRepository candidatRepository;
    private final CVChunkRepository cvChunkRepository;
    private final FlaskAiService flaskAiService;
    private final Tika tika;

    @Value("${ats.cv.storage.path:./uploads/cv}")
    private String storagePath;

    @Value("${ats.flask.url:http://localhost:5000}")
    private String pythonServiceUrl;

    public DocumentCVService(DocumentCVRepository documentCVRepository,
                             CandidatRepository candidatRepository,
                             CVChunkRepository cvChunkRepository,
                             FlaskAiService flaskAiService) {
        this.documentCVRepository = documentCVRepository;
        this.candidatRepository = candidatRepository;
        this.cvChunkRepository = cvChunkRepository;
        this.flaskAiService = flaskAiService;
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

    /**
     * Upload un CV pour un candidat existant (utilise par le candidat depuis la page jobs).
     * Sauvegarde le fichier sur disque ET extrait le texte avec Tika.
     */
    @Transactional
    public DocumentCVResponse uploadDocument(Long candidatId, MultipartFile file) {
        log.info("[CV Upload] Recherche candidat ID={}...", candidatId);
        Candidat candidat = candidatRepository.findById(candidatId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidat non trouve avec l'ID : " + candidatId));
        if (file.isEmpty()) {
            throw new BadRequestException("Le fichier est vide");
        }
        log.info("[CV Upload] Fichier recu: {}, taille: {} octets", file.getOriginalFilename(), file.getSize());
        return processAndSaveDocument(candidat, file);
    }

    /**
     * Upload par le recruteur : extrait les infos du CV et cree/maj le candidat.
     */
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
        return saveCandidatAndDocument(extraction, texteBrut, file.getOriginalFilename(), file);
    }

    @Transactional
    public DocumentCVResponse saveCandidatAndDocument(CandidatExtractionResponse extraction, String texteBrut,
                                                      String filename, MultipartFile file) {
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

        // Sauvegarder le fichier sur disque
        if (file != null && !file.isEmpty()) {
            try {
                String cheminFichier = saveFileToDisk(file, candidat.getId());
                document.setCheminStockage(cheminFichier);
            } catch (IOException e) {
                log.warn("[CV] Impossible de sauvegarder le fichier sur disque: {}", e.getMessage());
            }
        }

        document = documentCVRepository.save(document);
        log.info("[CV] Document ID={} sauvegarde pour candidat ID={}", document.getId(), candidat.getId());

        // Appeler Flask pour le score ATS + indexer le CV dans le pipeline RAG
        try {
            if (flaskAiService.isHealthy()) {
                Map<String, Object> analyse = flaskAiService.analyzeCv(texteBrut);
                log.info("[CV] Score ATS: {}% ({})", analyse.get("ats_score"), analyse.get("ats_method"));

                indexerDansRag(texteBrut, candidat.getId());
            }
        } catch (Exception e) {
            log.warn("[CV] Erreur analyse Flask: {}", e.getMessage());
        }

        return toResponse(document);
    }

    private CandidatExtractionResponse tryExtractWithPython(String texteBrut, String filename) {
        if (flaskAiService.isHealthy()) {
            try {
                Map<String, Object> data = flaskAiService.extractCvInfo(texteBrut);

                CandidatExtractionResponse result = new CandidatExtractionResponse();
                result.setEmail(data.get("email") != null ? data.get("email").toString() : null);
                result.setTelephone(data.get("phone") != null ? data.get("phone").toString() : null);

                String name = data.get("name") != null ? data.get("name").toString() : null;
                if (name != null && !name.isEmpty()) {
                    String[] parts = name.split("\\s+", 2);
                    if (parts.length >= 2) {
                        result.setPrenom(parts[0]);
                        result.setNom(parts[1]);
                    } else {
                        result.setPrenom(name);
                    }
                }

                if (result.getEmail() != null || result.getNom() != null) {
                    return result;
                }
            } catch (Exception e) {
                log.warn("[CV] Flask indisponible, fallback regex: {}", e.getMessage());
            }
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

    /**
     * Traite et sauvegarde un document CV : extrait le texte avec Tika,
     * sauvegarde le fichier sur disque, et persiste en base.
     */
    private DocumentCVResponse processAndSaveDocument(Candidat candidat, MultipartFile file) {
        DocumentCV document = new DocumentCV();
        document.setCandidat(candidat);
        document.setNomFichier(file.getOriginalFilename());
        document.setDateUpload(LocalDate.now());

        // 1. Extraire le texte avec Tika (gere PDF, DOCX, etc.)
        try {
            String texteBrut = tika.parseToString(file.getInputStream());
            if (texteBrut == null || texteBrut.trim().isEmpty()) {
                log.warn("[CV] Tika n'a pas pu extraire de texte de {}", file.getOriginalFilename());
                texteBrut = "";
            }
            document.setTexteBrut(texteBrut);
            log.info("[CV] Texte extrait: {} caracteres", texteBrut.length());
        } catch (Exception e) {
            log.error("[CV] Erreur extraction Tika: {}", e.getMessage());
            throw new BadRequestException("Erreur lors de la lecture du fichier : " + e.getMessage());
        }

        // 2. Sauvegarder le fichier physique sur disque
        try {
            String cheminFichier = saveFileToDisk(file, candidat.getId());
            document.setCheminStockage(cheminFichier);
            log.info("[CV] Fichier sauvegarde sur disque: {}", cheminFichier);
        } catch (IOException e) {
            log.warn("[CV] Impossible de sauvegarder sur disque: {}", e.getMessage());
            // Le document est quand meme sauvegarde en base avec le texte
        }

        // 3. Persister en base de donnees
        document = documentCVRepository.save(document);
        log.info("[CV] Document ID={} cree pour candidat ID={}, chemin={}",
                document.getId(), candidat.getId(), document.getCheminStockage());

        // 4. Indexer le CV dans le pipeline RAG (chunking + embeddings dans rag_cv_chunks)
        //    Ne bloque jamais l'upload : erreurs loggees mais avalees.
        indexerDansRag(document.getTexteBrut(), candidat.getId());

        return toResponse(document);
    }

    /**
     * Indexe un texte de CV dans le pipeline RAG Python (chunking + embeddings).
     * Volontairement tolerant aux pannes : n'importe quelle erreur ici est
     * loggee en warning mais ne doit jamais faire echouer l'upload du CV.
     */
    private void indexerDansRag(String texteBrut, Long candidatId) {
        if (texteBrut == null || texteBrut.isBlank() || candidatId == null) {
            return;
        }
        try {
            if (flaskAiService.isHealthy()) {
                Map<String, Object> indexResult = flaskAiService.indexCv(texteBrut, candidatId.toString());
                log.info("[CV] Indexation RAG - candidat ID={}, chunks stockes: {}",
                        candidatId, indexResult.get("chunks_stored"));
            }
        } catch (Exception e) {
            log.warn("[CV] Erreur indexation RAG pour candidat ID={}: {}", candidatId, e.getMessage());
        }
    }

    /**
     * Sauvegarde le fichier uploadé dans le repertoire de stockage.
     */
    private String saveFileToDisk(MultipartFile file, Long candidatId) throws IOException {
        Path storageDir = Paths.get(storagePath);
        if (!Files.exists(storageDir)) {
            Files.createDirectories(storageDir);
        }

        // Nom de fichier unique : candidatId_timestamp_nomOriginal
        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "cv.pdf";
        String safeName = originalName.replaceAll("[^a-zA-Z0-9._-]", "_");
        String fileName = candidatId + "_" + System.currentTimeMillis() + "_" + safeName;
        Path filePath = storageDir.resolve(fileName);

        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        return filePath.toAbsolutePath().toString();
    }

    @Transactional
    public void deleteDocument(Long id) {
        if (!documentCVRepository.existsById(id)) {
            throw new ResourceNotFoundException("Document CV non trouve avec l'ID : " + id);
        }
        // Supprimer le fichier physique si present
        documentCVRepository.findById(id).ifPresent(doc -> {
            if (doc.getCheminStockage() != null) {
                try {
                    Files.deleteIfExists(Paths.get(doc.getCheminStockage()));
                } catch (IOException e) {
                    log.warn("[CV] Impossible de supprimer le fichier: {}", e.getMessage());
                }
            }
        });
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