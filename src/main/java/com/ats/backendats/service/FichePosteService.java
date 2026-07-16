package com.ats.backendats.service;

import com.ats.backendats.dto.request.FichePosteRequest;
import com.ats.backendats.dto.response.FichePosteResponse;
import com.ats.backendats.exception.ResourceNotFoundException;
import com.ats.backendats.model.FichePoste;
import com.ats.backendats.model.RecruteurRH;
import com.ats.backendats.model.StatutPoste;
import com.ats.backendats.repository.FichePosteRepository;
import com.ats.backendats.repository.RecruteurRHRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FichePosteService {

    private final FichePosteRepository fichePosteRepository;
    private final RecruteurRHRepository recruteurRHRepository;

    public List<FichePosteResponse> getAllFiches() {
        return fichePosteRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public FichePosteResponse getFicheById(Long id) {
        FichePoste fiche = fichePosteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fiche de poste non trouvée avec l'ID : " + id));
        return toResponse(fiche);
    }

    public List<FichePosteResponse> getFichesByStatut(String statutStr) {
        StatutPoste statut = StatutPoste.valueOf(statutStr.toUpperCase());
        return fichePosteRepository.findByStatut(statut).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<FichePosteResponse> searchFiches(String titre) {
        return fichePosteRepository.findByTitreContainingIgnoreCase(titre).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public FichePosteResponse createFiche(FichePosteRequest request) {
        RecruteurRH recruteur = recruteurRHRepository.findById(request.getRecruteurId())
                .orElseThrow(() -> new ResourceNotFoundException("Recruteur non trouvé avec l'ID : " + request.getRecruteurId()));
        FichePoste fiche = new FichePoste();
        fiche.setTitre(request.getTitre());
        fiche.setDescription(request.getDescription());
        fiche.setRecruteur(recruteur);
        fiche.setStatut(StatutPoste.OUVERT);
        fiche.setDateCreation(java.time.LocalDate.now());
        fiche = fichePosteRepository.save(fiche);
        return toResponse(fiche);
    }

    @Transactional
    public FichePosteResponse updateFiche(Long id, FichePosteRequest request) {
        FichePoste fiche = fichePosteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fiche de poste non trouvée avec l'ID : " + id));
        fiche.setTitre(request.getTitre());
        fiche.setDescription(request.getDescription());
        if (request.getRecruteurId() != null) {
            RecruteurRH recruteur = recruteurRHRepository.findById(request.getRecruteurId())
                    .orElseThrow(() -> new ResourceNotFoundException("Recruteur non trouvé avec l'ID : " + request.getRecruteurId()));
            fiche.setRecruteur(recruteur);
        }
        fiche = fichePosteRepository.save(fiche);
        return toResponse(fiche);
    }

    @Transactional
    public void deleteFiche(Long id) {
        if (!fichePosteRepository.existsById(id)) {
            throw new ResourceNotFoundException("Fiche de poste non trouvée avec l'ID : " + id);
        }
        fichePosteRepository.deleteById(id);
    }

    private FichePosteResponse toResponse(FichePoste f) {
        String recruteurNom = f.getRecruteur() != null
                ? f.getRecruteur().getNom() + " " + f.getRecruteur().getPrenom()
                : null;
        return FichePosteResponse.builder()
                .id(f.getId())
                .titre(f.getTitre())
                .description(f.getDescription())
                .dateCreation(f.getDateCreation())
                .statut(f.getStatut() != null ? f.getStatut().name() : null)
                .recruteurId(f.getRecruteur() != null ? f.getRecruteur().getId() : null)
                .recruteurNom(recruteurNom)
                .build();
    }
}