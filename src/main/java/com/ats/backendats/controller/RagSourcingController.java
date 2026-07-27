package com.ats.backendats.controller;

import com.ats.backendats.model.Candidat;
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
    public ResponseEntity<List<Candidat>> semanticSearch(
            @RequestParam String query,
            @RequestParam(defaultValue = "10") int topK) {
        
        List<Candidat> results = ragSourcingService.semanticSearch(query, topK);
        return ResponseEntity.ok(results);
    }

    @PostMapping("/embed-all")
    public ResponseEntity<Map<String, Object>> embedAllExistingCVs() {
        int count = ragSourcingService.embedAllExistingCVs();
        return ResponseEntity.ok(Map.of(
                "message", "Successfully embedded CVs.",
                "count", count
        ));
    }
}
