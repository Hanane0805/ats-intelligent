package com.ats.backendats.controller;

import com.ats.backendats.dto.request.ConfigurationRequest;
import com.ats.backendats.dto.response.ConfigurationResponse;
import com.ats.backendats.service.ConfigurationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/configurations")
@RequiredArgsConstructor
public class ConfigurationController {

    private final ConfigurationService configurationService;

    @GetMapping
    public ResponseEntity<List<ConfigurationResponse>> getAllConfigurations() {
        return ResponseEntity.ok(configurationService.getAllConfigurations());
    }

    @GetMapping("/{cle}")
    public ResponseEntity<ConfigurationResponse> getConfigurationByCle(@PathVariable String cle) {
        return ResponseEntity.ok(configurationService.getConfigurationByCle(cle));
    }

    @PutMapping("/{cle}")
    public ResponseEntity<ConfigurationResponse> createOrUpdateConfiguration(
            @PathVariable String cle,
            @Valid @RequestBody ConfigurationRequest request) {
        return ResponseEntity.ok(configurationService.createOrUpdateConfiguration(cle, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteConfiguration(@PathVariable Long id) {
        configurationService.deleteConfiguration(id);
        return ResponseEntity.noContent().build();
    }
}