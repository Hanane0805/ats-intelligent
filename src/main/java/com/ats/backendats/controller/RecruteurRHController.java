package com.ats.backendats.controller;

import com.ats.backendats.dto.request.RegisterRecruteurRequest;
import com.ats.backendats.dto.response.RecruteurRHResponse;
import com.ats.backendats.service.RecruteurRHService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recruteurs")
@RequiredArgsConstructor
public class RecruteurRHController {

    private final RecruteurRHService recruteurRHService;

    @GetMapping
    public ResponseEntity<List<RecruteurRHResponse>> getAllRecruteurs() {
        return ResponseEntity.ok(recruteurRHService.getAllRecruteurs());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RecruteurRHResponse> getRecruteurById(@PathVariable Long id) {
        return ResponseEntity.ok(recruteurRHService.getRecruteurById(id));
    }

    @PostMapping
    public ResponseEntity<RecruteurRHResponse> createRecruteur(
            @Valid @RequestBody RegisterRecruteurRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(recruteurRHService.createRecruteur(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RecruteurRHResponse> updateRecruteur(
            @PathVariable Long id,
            @Valid @RequestBody RegisterRecruteurRequest request) {
        return ResponseEntity.ok(recruteurRHService.updateRecruteur(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRecruteur(@PathVariable Long id) {
        recruteurRHService.deleteRecruteur(id);
        return ResponseEntity.noContent().build();
    }
}