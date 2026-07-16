package com.ats.backendats.controller;

import com.ats.backendats.dto.AdministrateurRHResponse;
import com.ats.backendats.dto.RegisterAdministrateurRequest;
import com.ats.backendats.service.AdministrateurRHService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/administrateurs")
public class AdministrateurRHController {

    private final AdministrateurRHService administrateurRHService;

    public AdministrateurRHController(AdministrateurRHService administrateurRHService) {
        this.administrateurRHService = administrateurRHService;
    }

    @PostMapping
    public ResponseEntity<AdministrateurRHResponse> create(@Valid @RequestBody RegisterAdministrateurRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(administrateurRHService.create(request));
    }

    @GetMapping
    public ResponseEntity<List<AdministrateurRHResponse>> getAll() {
        return ResponseEntity.ok(administrateurRHService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdministrateurRHResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(administrateurRHService.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AdministrateurRHResponse> update(@PathVariable Long id,
                                                           @Valid @RequestBody RegisterAdministrateurRequest request) {
        return ResponseEntity.ok(administrateurRHService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        administrateurRHService.delete(id);
        return ResponseEntity.noContent().build();
    }
}