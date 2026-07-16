package com.ats.backendats.controller;

import com.ats.backendats.dto.response.DocumentCVResponse;
import com.ats.backendats.service.DocumentCVService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/documents-cv")
@RequiredArgsConstructor
public class DocumentCVController {

    private final DocumentCVService documentCVService;

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

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long id) {
        documentCVService.deleteDocument(id);
        return ResponseEntity.noContent().build();
    }
}