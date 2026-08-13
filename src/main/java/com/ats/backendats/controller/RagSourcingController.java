package com.ats.backendats.controller;

import com.ats.backendats.service.RagSourcingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sourcing")
@RequiredArgsConstructor
public class RagSourcingController {

    private final RagSourcingService ragSourcingService;

    @GetMapping("/search")
    public ResponseEntity<List<Map<String, Object>>> semanticSearch(
            @RequestParam String query,
            @RequestParam(defaultValue = "10") int topK) {
        List<Map<String, Object>> results = ragSourcingService.semanticSearch(query, topK);
        return ResponseEntity.ok(results);
    }
}