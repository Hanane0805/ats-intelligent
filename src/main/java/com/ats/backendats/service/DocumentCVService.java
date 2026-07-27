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
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.converter.BeanOutputConverter;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class DocumentCVService {

    private final DocumentCVRepository documentCVRepository;
    private final CandidatRepository candidatRepository;
    private final CVChunkRepository cvChunkRepository;
    private final ChatClient chatClient;
    private final EmbeddingModel embeddingModel;
    private final Tika tika;
    private final org.springframework.context.ApplicationContext applicationContext;
    private RagSourcingService ragSourcingService;

    public DocumentCVService(DocumentCVRepository documentCVRepository,
                             CandidatRepository candidatRepository,
                             CVChunkRepository cvChunkRepository,
                             ChatClient.Builder chatClientBuilder,
                             EmbeddingModel embeddingModel,
                             org.springframework.context.ApplicationContext applicationContext) {
        this.documentCVRepository = documentCVRepository;
        this.candidatRepository = candidatRepository;
        this.cvChunkRepository = cvChunkRepository;
        this.chatClient = chatClientBuilder.build();
        this.embeddingModel = embeddingModel;
        this.applicationContext = applicationContext;
        this.tika = new Tika();
    }

    private RagSourcingService getRagSourcingService() {
        if (ragSourcingService == null) {
            ragSourcingService = applicationContext.getBean(RagSourcingService.class);
        }
        return ragSourcingService;
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
                .orElseThrow(() -> new ResourceNotFoundException("Document CV non trouvé avec l'ID : " + id));
        return toResponse(doc);
    }

    @Transactional
    public DocumentCVResponse uploadDocument(Long candidatId, MultipartFile file) {
        Candidat candidat = candidatRepository.findById(candidatId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidat non trouvé avec l'ID : " + candidatId));
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

        // Tenter l'extraction IA AVANT la transaction (évite le rollback sur erreur 429)
        CandidatExtractionResponse extraction = tryExtractWithAI(texteBrut, file.getOriginalFilename());

        // Sauvegarder dans une transaction séparée
        return saveCandidatAndDocument(extraction, texteBrut, file.getOriginalFilename());
    }

    @Transactional
    public DocumentCVResponse saveCandidatAndDocument(CandidatExtractionResponse extraction, String texteBrut, String filename) {
        // Chercher un candidat existant ou le créer
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

        // Sauvegarder le DocumentCV
        DocumentCV document = new DocumentCV();
        document.setCandidat(candidat);
        document.setNomFichier(filename);
        document.setDateUpload(LocalDate.now());
        document.setTexteBrut(texteBrut);
        document = documentCVRepository.save(document);

        // Process chunks (RAG Setup)
        try {
            TokenTextSplitter splitter = new TokenTextSplitter();
            java.util.List<org.springframework.ai.document.Document> documents = splitter.split(
                java.util.Collections.singletonList(new org.springframework.ai.document.Document(texteBrut)));
            
            for (int i = 0; i < documents.size(); i++) {
                String chunkText = documents.get(i).getText();
                float[] embedding = embeddingModel.embed(chunkText);
                
                com.ats.backendats.model.CVChunk cvChunk = new com.ats.backendats.model.CVChunk();
                cvChunk.setContenuTexte(chunkText);
                cvChunk.setVecteurEmbedding(embedding);
                cvChunk.setIndexOrdre(i);
                cvChunk.setDocumentCV(document);
                cvChunkRepository.save(cvChunk);
            }
        } catch (Exception e) {
            System.err.println("Erreur lors de la création des chunks RAG (relationnels): " + e.getMessage());
        }

        // Push to Vector Store for Semantic Search
        try {
            getRagSourcingService().embedCandidateCV(candidat, document);
        } catch (Exception e) {
            System.err.println("Erreur lors du push dans le VectorStore: " + e.getMessage());
        }

        return toResponse(document);
    }

    /**
     * Tente d'extraire les infos du CV avec l'IA.
     * Si l'IA échoue (quota, erreur réseau...), utilise une extraction basique par regex.
     */
    private CandidatExtractionResponse tryExtractWithAI(String texteBrut, String filename) {
        try {
            BeanOutputConverter<CandidatExtractionResponse> converter = new BeanOutputConverter<>(CandidatExtractionResponse.class);
            
            // RAG Retrieval for extraction: We use the embedding of the prompt itself to find relevant info
            String query = "informations personnelles email nom prenom candidat";
            float[] queryVector = embeddingModel.embed(query);
            // Conversion vector to string for postgres pgvector 'findNearestChunks'
            String vectorString = java.util.Arrays.toString(queryVector);
            List<com.ats.backendats.model.CVChunk> relevantChunks = cvChunkRepository.findNearestChunks(vectorString, 3);
            
            String context = relevantChunks.stream()
                .map(com.ats.backendats.model.CVChunk::getContenuTexte)
                .collect(Collectors.joining("\n"));
            
            if (context.isEmpty()) {
                context = texteBrut.length() > 3000 ? texteBrut.substring(0, 3000) : texteBrut;
            }

            String prompt = "Tu es un assistant de recrutement. Extrait les informations personnelles du candidat à partir du texte de CV suivant. " +
                    "Si une information n'est pas trouvée, laisse le champ vide ou null.\n\n" +
                    "Contexte pertinent du CV:\n" + context +
                    "\n\n" + converter.getFormat();

            String response = chatClient.prompt().user(prompt).call().content();
            CandidatExtractionResponse result = converter.convert(response);
            if (result != null) return result;
        } catch (Throwable e) {
            // Fallback si l'IA échoue (quota 429, NonTransientAiException, réseau, etc.)
            System.err.println("[CV Analysis] IA indisponible, fallback regex: " + e.getMessage());
        }

        // Fallback : extraction par regex
        return extractWithRegex(texteBrut, filename);
    }

    /**
     * Extraction basique par regex : email depuis le texte, nom depuis le nom du fichier.
     */
    private CandidatExtractionResponse extractWithRegex(String texteBrut, String filename) {
        CandidatExtractionResponse result = new CandidatExtractionResponse();

        // Extraire l'email
        java.util.regex.Pattern emailPattern = java.util.regex.Pattern.compile(
                "[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}");
        java.util.regex.Matcher matcher = emailPattern.matcher(texteBrut);
        if (matcher.find()) {
            result.setEmail(matcher.group());
        }

        // Extraire nom/prénom depuis le nom du fichier (ex: "John_Doe_CV.pdf" -> "John" "Doe")
        if (filename != null) {
            String base = filename.replaceAll("(?i)[\\.](pdf|doc|docx)$", "")
                    .replaceAll("[_\\-]", " ").trim();
            // Supprimer mots génériques
            base = base.replaceAll("(?i)(cv|resume|curriculum|vitae)", "").trim();
            String[] parts = base.split("\\s+");
            if (parts.length >= 2) {
                result.setPrenom(parts[0]);
                result.setNom(parts[1]);
            } else if (parts.length == 1 && !parts[0].isEmpty()) {
                result.setNom(parts[0]);
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
            throw new ResourceNotFoundException("Document CV non trouvé avec l'ID : " + id);
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