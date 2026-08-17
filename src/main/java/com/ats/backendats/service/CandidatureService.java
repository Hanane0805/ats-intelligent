package com.ats.backendats.service;

import com.ats.backendats.dto.request.CandidatureRequest;
import com.ats.backendats.dto.request.CandidatureUpdateRequest;
import com.ats.backendats.dto.request.HistoriqueRecrutementRequest;
import com.ats.backendats.dto.response.AnalyseIAResponse;
import com.ats.backendats.dto.response.CandidatureResponse;
import com.ats.backendats.exception.BadRequestException;
import com.ats.backendats.exception.ResourceNotFoundException;
import com.ats.backendats.model.AnalyseIA;
import com.ats.backendats.model.Candidat;
import com.ats.backendats.model.Candidature;
import com.ats.backendats.model.FichePoste;
import com.ats.backendats.model.StatutCandidature;
import com.ats.backendats.model.DocumentCV;
import com.ats.backendats.repository.AnalyseIARepository;
import com.ats.backendats.repository.CandidatRepository;
import com.ats.backendats.repository.CandidatureRepository;
import com.ats.backendats.repository.DocumentCVRepository;
import com.ats.backendats.repository.FichePosteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class CandidatureService {

    private final CandidatureRepository candidatureRepository;
    private final CandidatRepository candidatRepository;
    private final FichePosteRepository fichePosteRepository;
    private final AnalyseIARepository analyseIARepository;
    private final DocumentCVRepository documentCVRepository;
    private final N8nWebhookService n8nWebhookService;
    private final RagScoringService ragScoringService;
    private final HistoriqueRecrutementService historiqueService;

    public CandidatureService(CandidatureRepository candidatureRepository,
                              CandidatRepository candidatRepository,
                              FichePosteRepository fichePosteRepository,
                              AnalyseIARepository analyseIARepository,
                              DocumentCVRepository documentCVRepository,
                              N8nWebhookService n8nWebhookService,
                              RagScoringService ragScoringService,
                              HistoriqueRecrutementService historiqueService) {
        this.candidatureRepository = candidatureRepository;
        this.candidatRepository = candidatRepository;
        this.fichePosteRepository = fichePosteRepository;
        this.analyseIARepository = analyseIARepository;
        this.documentCVRepository = documentCVRepository;
        this.n8nWebhookService = n8nWebhookService;
        this.ragScoringService = ragScoringService;
        this.historiqueService = historiqueService;
    }

    public List<CandidatureResponse> getAllCandidatures() {
        return candidatureRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public CandidatureResponse getCandidatureById(Long id) {
        Candidature candidature = candidatureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidature non trouvee avec l'ID : " + id));
        return toResponse(candidature);
    }

    public List<CandidatureResponse> getCandidaturesByCandidat(Long candidatId) {
        return candidatureRepository.findByCandidatId(candidatId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<CandidatureResponse> getCandidaturesByPoste(Long fichePosteId) {
        return candidatureRepository.findByFichePosteId(fichePosteId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<CandidatureResponse> getCandidaturesByStatut(String statutStr) {
        StatutCandidature statut = StatutCandidature.valueOf(statutStr.toUpperCase());
        return candidatureRepository.findByStatut(statut).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public CandidatureResponse createCandidature(CandidatureRequest request) {
        Candidat candidat = candidatRepository.findById(request.getCandidatId())
                .orElseThrow(() -> new ResourceNotFoundException("Candidat non trouve avec l'ID : " + request.getCandidatId()));
        FichePoste fichePoste = fichePosteRepository.findById(request.getFichePosteId())
                .orElseThrow(() -> new ResourceNotFoundException("Fiche de poste non trouvee avec l'ID : " + request.getFichePosteId()));
        if (candidatureRepository.existsByCandidatIdAndFichePosteId(request.getCandidatId(), request.getFichePosteId())) {
            throw new BadRequestException("Ce candidat a deja postule a cette offre");
        }
        Candidature candidature = new Candidature();
        candidature.setCandidat(candidat);
        candidature.setFichePoste(fichePoste);
        candidature.setStatut(StatutCandidature.EN_ATTENTE);
        candidature.setDatePostulation(java.time.LocalDate.now());
        candidature = candidatureRepository.save(candidature);
        saveHistory(candidature, null, "EN_ATTENTE");
        n8nWebhookService.notifyCandidatureCreated(candidature);
        return toResponse(candidature);
    }

    @Transactional
    public CandidatureResponse updateCandidature(Long id, CandidatureUpdateRequest request) {
        Candidature candidature = candidatureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidature non trouvee avec l'ID : " + id));
        String ancienStatut = candidature.getStatut() != null ? candidature.getStatut().name() : null;
        if (request.getStatut() != null) {
            candidature.setStatut(StatutCandidature.valueOf(request.getStatut().toUpperCase()));
        }
        if (request.getScoreCompatibilite() != null) {
            candidature.setScoreCompatibilite(request.getScoreCompatibilite());
        }
        candidature = candidatureRepository.save(candidature);
        String nouveauStatut = candidature.getStatut() != null ? candidature.getStatut().name() : null;
        if (!Objects.equals(ancienStatut, nouveauStatut)) {
            saveHistory(candidature, ancienStatut, nouveauStatut);
        }
        n8nWebhookService.notifyCandidatureUpdated(candidature, ancienStatut);
        return toResponse(candidature);
    }

    @Transactional
    public void deleteCandidature(Long id) {
        if (!candidatureRepository.existsById(id)) {
            throw new ResourceNotFoundException("Candidature non trouvee avec l'ID : " + id);
        }
        candidatureRepository.deleteById(id);
    }

    @Transactional
    public CandidatureResponse analyzeCandidature(Long candidatureId) {
        Candidature candidature = candidatureRepository.findById(candidatureId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidature non trouvee avec l'ID : " + candidatureId));

        String ancienStatut = candidature.getStatut() != null ? candidature.getStatut().name() : null;
        candidature.setStatut(StatutCandidature.EN_ANALYSE);
        candidatureRepository.save(candidature);
        saveHistory(candidature, ancienStatut, "EN_ANALYSE");

        FichePoste poste = candidature.getFichePoste();
        if (poste == null) throw new BadRequestException("Aucune fiche de poste associee.");

        Candidat candidat = candidature.getCandidat();
        String candidatNom = (candidat.getNom() != null ? candidat.getNom() : "")
                + " " + (candidat.getPrenom() != null ? candidat.getPrenom() : "");

        List<DocumentCV> cvs = documentCVRepository.findByCandidatId(candidat.getId());
        String cvText = "Aucun CV fourni.";
        if (!cvs.isEmpty()) {
            cvText = cvs.get(0).getTexteBrut();
        }
        if (cvText == null || cvText.isBlank()) {
            cvText = "Aucun CV fourni.";
        }

        String jobDescription = poste.getTitre() + " " + (poste.getDescription() != null ? poste.getDescription() : "");

        try {
            Map<String, Object> ragResult = ragScoringService.scoreWithRAG(
                    candidat.getId(),
                    candidatNom.trim(),
                    poste.getId(),
                    poste.getTitre(),
                    cvText,
                    jobDescription
            );

            int score = ((Number) ragResult.get("score")).intValue();
            String rawResponse = (String) ragResult.get("rawResponse");

            String syntheseForces = extractJsonStringField(rawResponse, "analyse");
            String competencesMatch = extractJsonListAsString(rawResponse, "competencesMatch");
            String competencesManquantes = extractJsonListAsString(rawResponse, "competencesManquantes");

            String forcesText = (competencesMatch != null && !competencesMatch.isEmpty())
                    ? competencesMatch : (syntheseForces != null ? syntheseForces : "Analyse en cours");
            String faiblessesText = (competencesManquantes != null && !competencesManquantes.isEmpty())
                    ? competencesManquantes : "Aucune faiblesse majeure identifiee";
            String recommandation = syntheseForces != null ? syntheseForces : "Candidature a evaluer en entretien.";

            AnalyseIA analyse = new AnalyseIA();
            analyse.setScore(Math.round(score * 10.0) / 10.0);
            analyse.setSyntheseForces(forcesText);
            analyse.setSyntheseFaiblesses(faiblessesText);
            analyse.setRecommandation(recommandation);
            analyse.setDateAnalyse(java.time.LocalDate.now());
            analyse = analyseIARepository.save(analyse);

            candidature.setAnalyseIA(analyse);
            candidature.setScoreCompatibilite(analyse.getScore() / 100.0);
            candidature.setStatut(StatutCandidature.EN_ATTENTE);
            candidature = candidatureRepository.save(candidature);

            n8nWebhookService.notifyCandidatureUpdated(candidature, "EN_ANALYSE");
            return toResponse(candidature);

        } catch (Exception e) {
            System.err.println("Erreur RAG lors de l'analyse : " + e.getMessage());
            e.printStackTrace();
            candidature.setStatut(StatutCandidature.EN_ATTENTE);
            candidatureRepository.save(candidature);
            throw new BadRequestException("L'analyse IA a echoue : " + e.getMessage());
        }
    }

    private String extractJsonStringField(String json, String fieldName) {
        if (json == null) return null;
        String searchKey = "\"" + fieldName + "\":";
        int idx = json.indexOf(searchKey);
        if (idx < 0) return null;
        int startQuote = json.indexOf("\"", idx + searchKey.length());
        if (startQuote < 0) return null;
        int end = startQuote + 1;
        while (end < json.length()) {
            char c = json.charAt(end);
            if (c == '\\' && end + 1 < json.length()) {
                end += 2;
                continue;
            }
            if (c == '"') break;
            end++;
        }
        String value = json.substring(startQuote + 1, end);
        value = value.replace("\\n", " ").replace("\\t", " ");
        if (value.trim().isEmpty()) return null;
        return value;
    }

    private String extractJsonListAsString(String json, String fieldName) {
        if (json == null) return null;
        String searchKey = "\"" + fieldName + "\":";
        int idx = json.indexOf(searchKey);
        if (idx < 0) return null;
        int start = json.indexOf("[", idx + searchKey.length());
        if (start < 0) return null;
        int end = json.indexOf("]", start);
        if (end < 0) return null;
        String listContent = json.substring(start + 1, end);
        StringBuilder result = new StringBuilder();
        String[] parts = listContent.split("\"");
        for (int i = 1; i < parts.length; i += 2) {
            if (i > 1) result.append(", ");
            result.append(parts[i]);
        }
        return result.length() > 0 ? result.toString() : null;
    }

    private CandidatureResponse toResponse(Candidature c) {
        AnalyseIAResponse analyseResponse = null;
        if (c.getAnalyseIA() != null) {
            AnalyseIA a = c.getAnalyseIA();
            analyseResponse = AnalyseIAResponse.builder()
                    .id(a.getId())
                    .score(a.getScore())
                    .syntheseForces(a.getSyntheseForces())
                    .syntheseFaiblesses(a.getSyntheseFaiblesses())
                    .recommandation(a.getRecommandation())
                    .dateAnalyse(a.getDateAnalyse())
                    .build();
        }
        return CandidatureResponse.builder()
                .id(c.getId())
                .datePostulation(c.getDatePostulation())
                .scoreCompatibilite(c.getScoreCompatibilite())
                .statut(c.getStatut() != null ? c.getStatut().name() : null)
                .candidatId(c.getCandidat() != null ? c.getCandidat().getId() : null)
                .candidatNom(c.getCandidat() != null ? c.getCandidat().getNom() + " " + c.getCandidat().getPrenom() : null)
                .fichePosteId(c.getFichePoste() != null ? c.getFichePoste().getId() : null)
                .fichePosteTitre(c.getFichePoste() != null ? c.getFichePoste().getTitre() : null)
                .analyseIA(analyseResponse)
                .build();
    }

    /**
     * Enregistre un changement de statut dans l'historique de recrutement.
     */
    private void saveHistory(Candidature candidature, String ancienStatut, String nouveauStatut) {
        try {
            HistoriqueRecrutementRequest req = new HistoriqueRecrutementRequest();
            req.setCandidatureId(candidature.getId());
            req.setAncienStatut(ancienStatut);
            req.setNouveauStatut(nouveauStatut);
            req.setCommentaire("Changement automatique : " + ancienStatut + " → " + nouveauStatut);
            historiqueService.createHistorique(req);
        } catch (Exception e) {
            // Ne pas bloquer le flux principal si l'historique échoue
            System.err.println("[Historique] Erreur lors de la sauvegarde : " + e.getMessage());
        }
    }
}