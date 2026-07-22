package com.ats.backendats.controller;

import com.ats.backendats.dto.request.HistoriqueRecrutementRequest;
import com.ats.backendats.dto.request.NotificationRequest;
import com.ats.backendats.dto.response.HistoriqueRecrutementResponse;
import com.ats.backendats.dto.response.NotificationResponse;
import com.ats.backendats.service.HistoriqueRecrutementService;
import com.ats.backendats.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/n8n")
@RequiredArgsConstructor
public class N8nController {

    private final NotificationService notificationService;
    private final HistoriqueRecrutementService historiqueService;

    @PostMapping("/notifications")
    public ResponseEntity<NotificationResponse> createNotification(
            @Valid @RequestBody NotificationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(notificationService.createNotification(request));
    }

    @PostMapping("/historiques")
    public ResponseEntity<HistoriqueRecrutementResponse> createHistorique(
            @Valid @RequestBody HistoriqueRecrutementRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(historiqueService.createHistorique(request));
    }
}
