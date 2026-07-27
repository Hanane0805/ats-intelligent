package com.ats.backendats.service;

import com.ats.backendats.exception.ResourceNotFoundException;
import com.ats.backendats.model.Candidature;
import com.ats.backendats.model.Entretien;
import com.ats.backendats.model.StatutEntretien;
import com.ats.backendats.repository.CandidatureRepository;
import com.ats.backendats.repository.EntretienRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class EntretienService {

    private final EntretienRepository entretienRepository;
    private final CandidatureRepository candidatureRepository;

    public List<Entretien> getEntretiensByCandidature(Long candidatureId) {
        return entretienRepository.findByCandidatureId(candidatureId);
    }

    public List<Entretien> getEntretiensByCandidat(Long candidatId) {
        return entretienRepository.findByCandidatureCandidatId(candidatId);
    }

    public List<Entretien> getAllEntretiens() {
        return entretienRepository.findAllByOrderByDateHeureAsc();
    }

    @Transactional
    public Entretien planifierEntretien(Long candidatureId, Map<String, Object> body) {
        Candidature candidature = candidatureRepository.findById(candidatureId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidature non trouvée : " + candidatureId));

        Entretien entretien = new Entretien();
        entretien.setCandidature(candidature);
        entretien.setDateHeure(LocalDateTime.parse((String) body.get("dateHeure")));
        entretien.setDureeMinutes(body.get("dureeMinutes") != null ? (Integer) body.get("dureeMinutes") : 60);
        entretien.setTypeEntretien((String) body.getOrDefault("typeEntretien", "PRESENTIEL"));
        entretien.setLienVisio((String) body.get("lienVisio"));
        entretien.setLieu((String) body.get("lieu"));
        entretien.setNotes((String) body.get("notes"));
        entretien.setStatutEntretien(StatutEntretien.PLANIFIE);
        entretien.setDateCreation(LocalDateTime.now());

        // Auto-update candidature status to ENTRETIEN
        candidature.setStatut(com.ats.backendats.model.StatutCandidature.ENTRETIEN);
        candidatureRepository.save(candidature);

        return entretienRepository.save(entretien);
    }

    @Transactional
    public Entretien updateStatut(Long entretienId, String statut) {
        Entretien entretien = entretienRepository.findById(entretienId)
                .orElseThrow(() -> new ResourceNotFoundException("Entretien non trouvé : " + entretienId));
        entretien.setStatutEntretien(StatutEntretien.valueOf(statut));
        return entretienRepository.save(entretien);
    }

    @Transactional
    public void deleteEntretien(Long entretienId) {
        if (!entretienRepository.existsById(entretienId)) {
            throw new ResourceNotFoundException("Entretien non trouvé : " + entretienId);
        }
        entretienRepository.deleteById(entretienId);
    }
}
