package com.ats.backendats.controller;

import com.ats.backendats.dto.response.JournalAuditResponse;
import com.ats.backendats.service.JournalAuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/logs")
@RequiredArgsConstructor
public class JournalAuditController {

    private final JournalAuditService journalAuditService;

    @GetMapping
    public ResponseEntity<List<JournalAuditResponse>> getAllLogs() {
        return ResponseEntity.ok(journalAuditService.getAllLogs());
    }
}
