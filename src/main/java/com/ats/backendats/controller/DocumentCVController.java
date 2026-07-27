package com.ats.backendats.controller;

import com.ats.backendats.dto.response.DocumentCVResponse;
import com.ats.backendats.exception.ResourceNotFoundException;
import com.ats.backendats.model.DocumentCV;
import com.ats.backendats.repository.DocumentCVRepository;
import com.ats.backendats.service.DocumentCVService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/api/documents-cv")
@RequiredArgsConstructor
public class DocumentCVController {

    private final DocumentCVService documentCVService;
    private final DocumentCVRepository documentCVRepository;

    @GetMapping
    public ResponseEntity<List<DocumentCVResponse>> getAllDocuments() {
        return ResponseEntity.ok(documentCVService.getAllDocuments());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DocumentCVResponse> getDocumentById(@PathVariable Long id) {
        return ResponseEntity.ok(documentCVService.getDocumentById(id));
    }

    @GetMapping("/candidat/{candidatId}")
    public ResponseEntity<List<DocumentCVResponse>> getDocumentsByCandidat(
            @PathVariable Long candidatId) {
        return ResponseEntity.ok(documentCVService.getDocumentsByCandidat(candidatId));
    }

    @PostMapping("/upload/{candidatId}")
    public ResponseEntity<DocumentCVResponse> uploadDocument(
            @PathVariable Long candidatId,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(documentCVService.uploadDocument(candidatId, file));
    }

    @PostMapping("/analyze-bulk")
    public ResponseEntity<DocumentCVResponse> analyzeAndCreateCandidate(
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(documentCVService.analyzeAndCreateCandidate(file));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long id) {
        documentCVService.deleteDocument(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Stream / download a CV file by its document ID.
     */
    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadDocument(@PathVariable Long id) throws IOException {
        DocumentCV doc = documentCVRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document CV non trouvé : " + id));

        if (doc.getCheminStockage() == null || doc.getCheminStockage().isBlank()) {
            return ResponseEntity.notFound().build();
        }

        Path filePath = Paths.get(doc.getCheminStockage());
        Resource resource = new UrlResource(filePath.toUri());

        if (!resource.exists() || !resource.isReadable()) {
            return ResponseEntity.notFound().build();
        }

        String contentType = doc.getNomFichier() != null && doc.getNomFichier().toLowerCase().endsWith(".pdf")
                ? "application/pdf"
                : "application/octet-stream";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + doc.getNomFichier() + "\"")
                .body(resource);
    }
}