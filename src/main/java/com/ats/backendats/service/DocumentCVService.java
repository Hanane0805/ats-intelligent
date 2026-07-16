package com.ats.backendats.service;

import com.ats.backendats.dto.response.DocumentCVResponse;
import com.ats.backendats.exception.BadRequestException;
import com.ats.backendats.exception.ResourceNotFoundException;
import com.ats.backendats.model.Candidat;
import com.ats.backendats.model.DocumentCV;
import com.ats.backendats.repository.CandidatRepository;
import com.ats.backendats.repository.CVChunkRepository;
import com.ats.backendats.repository.DocumentCVRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DocumentCVService {

    private final DocumentCVRepository documentCVRepository;
    private final CandidatRepository candidatRepository;
    private final CVChunkRepository cvChunkRepository;

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
        DocumentCV document = new DocumentCV();
        document.setCandidat(candidat);
        document.setNomFichier(file.getOriginalFilename());
        document.setDateUpload(LocalDate.now());
        try {
            document.setTexteBrut(new String(file.getBytes()));
        } catch (IOException e) {
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