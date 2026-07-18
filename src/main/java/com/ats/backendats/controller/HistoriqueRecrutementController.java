package com.ats.backendats.controller;

import com.ats.backendats.dto.response.HistoriqueRecrutementResponse;
import com.ats.backendats.service.HistoriqueRecrutementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/historiques")
@RequiredArgsConstructor
public class HistoriqueRecrutementController {

    private final HistoriqueRecrutementService historiqueService;

    @GetMapping
    public ResponseEntity<List<HistoriqueRecrutementResponse>> getAllHistoriques() {
        return ResponseEntity.ok(historiqueService.getAllHistoriques());
    }
}
