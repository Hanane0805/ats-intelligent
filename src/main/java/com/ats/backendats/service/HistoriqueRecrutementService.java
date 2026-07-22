package com.ats.backendats.service;

import com.ats.backendats.dto.request.HistoriqueRecrutementRequest;
import com.ats.backendats.dto.response.HistoriqueRecrutementResponse;
import com.ats.backendats.exception.ResourceNotFoundException;
import com.ats.backendats.model.Candidature;
import com.ats.backendats.model.HistoriqueRecrutement;
import com.ats.backendats.repository.CandidatureRepository;
import com.ats.backendats.repository.HistoriqueRecrutementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HistoriqueRecrutementService {

    private final HistoriqueRecrutementRepository historiqueRepository;
    private final CandidatureRepository candidatureRepository;

    @Transactional
    public HistoriqueRecrutementResponse createHistorique(HistoriqueRecrutementRequest request) {
        Candidature candidature = candidatureRepository.findById(request.getCandidatureId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Candidature non trouvée avec l'ID : " + request.getCandidatureId()));

        HistoriqueRecrutement historique = new HistoriqueRecrutement();
        historique.setAncienStatut(request.getAncienStatut());
        historique.setNouveauStatut(request.getNouveauStatut());
        historique.setCommentaire(request.getCommentaire());
        historique.setDateChangement(LocalDate.now());
        historique.setCandidature(candidature);
        historique.setCandidat(candidature.getCandidat());
        historique = historiqueRepository.save(historique);
        return mapToResponse(historique);
    }

    public List<HistoriqueRecrutementResponse> getAllHistoriques() {
        return historiqueRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private HistoriqueRecrutementResponse mapToResponse(HistoriqueRecrutement historique) {
        String nom = "";
        if (historique.getCandidat() != null) {
            nom = historique.getCandidat().getPrenom() + " " + historique.getCandidat().getNom();
        }

        String poste = "";
        if (historique.getCandidature() != null && historique.getCandidature().getFichePoste() != null) {
            poste = historique.getCandidature().getFichePoste().getTitre();
        }

        return HistoriqueRecrutementResponse.builder()
                .id(historique.getId())
                .ancienStatut(historique.getAncienStatut())
                .nouveauStatut(historique.getNouveauStatut())
                .dateChangement(historique.getDateChangement())
                .commentaire(historique.getCommentaire())
                .candidatId(historique.getCandidat() != null ? historique.getCandidat().getId() : null)
                .candidatNom(nom)
                .candidatureId(historique.getCandidature() != null ? historique.getCandidature().getId() : null)
                .posteTitre(poste)
                .build();
    }
}
