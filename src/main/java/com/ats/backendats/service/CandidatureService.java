package com.ats.backendats.service;

import com.ats.backendats.dto.request.CandidatureRequest;
import com.ats.backendats.dto.request.CandidatureUpdateRequest;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class CandidatureService {

    private static final Logger log = LoggerFactory.getLogger(CandidatureService.class);

    private final CandidatureRepository candidatureRepository;
    private final CandidatRepository candidatRepository;
    private final FichePosteRepository fichePosteRepository;
    private final AnalyseIARepository analyseIARepository;
    private final DocumentCVRepository documentCVRepository;
    private final HistoriqueRecrutementService historiqueService;
    private final FlaskAiService flaskAiService;

    public CandidatureService(CandidatureRepository candidatureRepository,
                              CandidatRepository candidatRepository,
                              FichePosteRepository fichePosteRepository,
                              AnalyseIARepository analyseIARepository,
                              DocumentCVRepository documentCVRepository,
                              HistoriqueRecrutementService historiqueService,
                              FlaskAiService flaskAiService) {
        this.candidatureRepository = candidatureRepository;
        this.candidatRepository = candidatRepository;
        this.fichePosteRepository = fichePosteRepository;
        this.analyseIARepository = analyseIARepository;
        this.documentCVRepository = documentCVRepository;
        this.historiqueService = historiqueService;
        this.flaskAiService = flaskAiService;
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
            saveHistory(candidature, ancienStatut, nouveauStatut, request.getCommentaire());
        }
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

        // ===== VERIFICATION CV =====
        Long candidatId = candidature.getCandidat().getId();
        log.info("[Analyse] Recherche CV pour candidat ID={}...", candidatId);
        List<DocumentCV> cvs = documentCVRepository.findByCandidatId(candidatId);
        if (cvs.isEmpty()) {
            log.warn("[Analyse] Aucun CV pour candidat ID={}", candidatId);
            candidature.setStatut(StatutCandidature.EN_ATTENTE);
            candidatureRepository.save(candidature);
            throw new BadRequestException("Aucun CV trouve pour ce candidat (ID: " + candidatId + "). Veuillez d'abord televerser un CV.");
        }
        // Prendre le CV le plus recent
        DocumentCV cvDoc = cvs.get(0);
        for (DocumentCV c : cvs) {
            if (c.getDateUpload() != null && cvDoc.getDateUpload() != null
                    && c.getDateUpload().isAfter(cvDoc.getDateUpload())) {
                cvDoc = c;
            }
        }

        String cvText = cvDoc.getTexteBrut();
        if (cvText == null || cvText.isBlank()) {
            log.warn("[Analyse] CV ID={} vide pour candidat ID={}", cvDoc.getId(), candidatId);
            candidature.setStatut(StatutCandidature.EN_ATTENTE);
            candidatureRepository.save(candidature);
            throw new BadRequestException("Le CV de ce candidat est vide ou illisible (Document ID: " + cvDoc.getId() + "). Veuillez televerser un CV valide.");
        }
        log.info("[Analyse] CV trouve: ID={}, {} caracteres", cvDoc.getId(), cvText.length());

        // Construire la description du poste
        String jobDescription = poste.getTitre();
        if (poste.getDescription() != null) {
            jobDescription += " " + poste.getDescription();
        }

        try {
            // ===== APPEL AU SERVICE FLASK IA =====
            Map<String, Object> result = flaskAiService.fullAnalysis(cvText, jobDescription);

            // Extraire le score ATS
            @SuppressWarnings("unchecked")
            Map<String, Object> analyseAts = (Map<String, Object>) result.get("analyse_ats");
            double atsScore = ((Number) analyseAts.get("ats_score")).doubleValue();

            // Extraire les points forts et faiblesses
            @SuppressWarnings("unchecked")
            List<String> pointsForts = (List<String>) analyseAts.get("points_forts");
            @SuppressWarnings("unchecked")
            List<String> aAmeliorer = (List<String>) analyseAts.get("a_ameliorer");
            String atsExplication = (String) analyseAts.get("explication");

            // Extraire le score de compatibilite si disponible
            Double compatScore = null;
            String recommandationLisible = null;
            if (result.containsKey("compatibilite")) {
                @SuppressWarnings("unchecked")
                Map<String, Object> compat = (Map<String, Object>) result.get("compatibilite");
                compatScore = ((Number) compat.get("total_score")).doubleValue();

                // Utiliser la recommandation lisible de Flask si disponible
                recommandationLisible = (String) compat.get("recommandation");
                if (recommandationLisible == null || recommandationLisible.isBlank()) {
                    // Fallback: generer une recommandation ici si Flask ne l'a pas fait
                    @SuppressWarnings("unchecked")
                    List<String> matchedSkills = (List<String>) compat.getOrDefault("matched_skills", Collections.emptyList());
                    @SuppressWarnings("unchecked")
                    List<String> missingSkills = (List<String>) compat.getOrDefault("missing_skills", Collections.emptyList());
                    recommandationLisible = buildRecommendation(
                            compatScore,
                            (Double) compat.getOrDefault("semantic_similarity", 0.0),
                            (Double) compat.getOrDefault("skill_match", 0.0),
                            (Double) compat.getOrDefault("experience_match", 0.0),
                            ((Number) compat.getOrDefault("cv_experience_years", 0)).intValue(),
                            ((Number) compat.getOrDefault("required_experience_years", 0)).intValue(),
                            matchedSkills,
                            missingSkills
                    );
                }
            }

            // Construire les syntheses
            String forcesText = pointsForts != null && !pointsForts.isEmpty()
                    ? String.join(", ", pointsForts)
                    : "Analyse en cours";
            String faiblessesText = aAmeliorer != null && !aAmeliorer.isEmpty()
                    ? String.join(", ", aAmeliorer)
                    : "Aucune faiblesse majeure identifiee";

            // Score final
            double finalScore = (compatScore != null) ? compatScore : atsScore;

            // Recommandation finale
            String recommandationFinale;
            if (recommandationLisible != null) {
                recommandationFinale = recommandationLisible;
            } else {
                // Fallback si pas de compatibilite calculee (pas d'offre fournie)
                recommandationFinale = buildAtsOnlyRecommendation(atsScore, pointsForts, aAmeliorer, atsExplication);
            }

            // Sauvegarder l'analyse
            AnalyseIA analyse = new AnalyseIA();
            analyse.setScore(finalScore);
            analyse.setSyntheseForces(forcesText);
            analyse.setSyntheseFaiblesses(faiblessesText);
            analyse.setRecommandation(recommandationFinale);
            analyse.setDateAnalyse(java.time.LocalDate.now());
            analyse = analyseIARepository.save(analyse);

            candidature.setAnalyseIA(analyse);
            candidature.setScoreCompatibilite(finalScore / 100.0);
            candidature.setStatut(StatutCandidature.EN_ATTENTE);
            candidature = candidatureRepository.save(candidature);

            saveHistory(candidature, "EN_ANALYSE", "EN_ATTENTE");
            log.info("[Analyse] Terminee pour candidature ID={} - Score: {}%", candidatureId, finalScore);
            return toResponse(candidature);

        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("[Analyse] Erreur IA : {}", e.getMessage(), e);
            candidature.setStatut(StatutCandidature.EN_ATTENTE);
            candidatureRepository.save(candidature);
            throw new BadRequestException("L'analyse IA a echoue : " + e.getMessage());
        }
    }

    /**
     * Genere une recommandation lisible quand on a le score de compatibilite.
     */
    private String buildRecommendation(double totalScore, double semantic, double skillMatch,
                                       double expMatch, int cvExp, int requiredExp,
                                       List<String> matchedSkills, List<String> missingSkills) {
        StringBuilder sb = new StringBuilder();

        // Appreciation globale
        if (totalScore >= 75) {
            sb.append(String.format("Excellent profil ! Le candidat obtient un score de compatibilite de %.1f%%, " +
                    "ce qui indique une tres bonne adequation avec le poste.", totalScore));
        } else if (totalScore >= 55) {
            sb.append(String.format("Bon profil globalement compatible avec le poste (score: %.1f%%). " +
                    "Quelques points d'amelioration sont possibles.", totalScore));
        } else if (totalScore >= 35) {
            sb.append(String.format("Profil partiellement compatible (score: %.1f%%). " +
                    "Des competences ou de l'experience manquantes limitent l'adequation.", totalScore));
        } else {
            sb.append(String.format("Profil peu compatible avec le poste (score: %.1f%%). " +
                    "Des ecarts significatifs existent par rapport aux exigences.", totalScore));
        }

        // Competences
        if (matchedSkills != null && !matchedSkills.isEmpty()) {
            String skills = String.join(", ", matchedSkills.subList(0, Math.min(8, matchedSkills.size())));
            sb.append(" Competences correspondantes : ").append(skills).append(".");
        }
        if (missingSkills != null && !missingSkills.isEmpty()) {
            String missing = String.join(", ", missingSkills.subList(0, Math.min(6, missingSkills.size())));
            sb.append(" Competences manquantes : ").append(missing).append(".");
        }

        // Experience
        if (requiredExp > 0) {
            if (cvExp >= requiredExp) {
                sb.append(String.format(" Experience conforme (%d ans vs %d requis).", cvExp, requiredExp));
            } else {
                sb.append(String.format(" Experience insuffisante (%d ans vs %d requis).", cvExp, requiredExp));
            }
        }

        // Recommandation
        if (totalScore >= 75) {
            sb.append(" Ce candidat merite une entrevue approfondie.");
        } else if (totalScore >= 55) {
            sb.append(" Candidat a envisager pour un entretien.");
        } else {
            sb.append(" D'autres candidats plus adaptes devraient etre privilgies.");
        }

        return sb.toString();
    }

    /**
     * Genere une recommandation quand on a seulement le score ATS (pas d'offre).
     */
    private String buildAtsOnlyRecommendation(double atsScore, List<String> pointsForts,
                                              List<String> aAmeliorer, String atsExplication) {
        StringBuilder sb = new StringBuilder();

        if (atsScore >= 70) {
            sb.append(String.format("CV de bonne qualite (score ATS: %.1f%%). ", atsScore));
        } else if (atsScore >= 45) {
            sb.append(String.format("CV de qualite moyenne (score ATS: %.1f%%). ", atsScore));
        } else {
            sb.append(String.format("CV de qualite insuffisante (score ATS: %.1f%%). ", atsScore));
        }

        if (pointsForts != null && !pointsForts.isEmpty()) {
            sb.append("Points forts : ").append(String.join(", ", pointsForts)).append(".");
        }
        if (aAmeliorer != null && !aAmeliorer.isEmpty()) {
            sb.append(" A ameliorer : ").append(String.join(", ", aAmeliorer)).append(".");
        }

        if (atsScore >= 70) {
            sb.append(" Ce CV est bien structure et passe les filtres ATS efficacement.");
        } else if (atsScore >= 45) {
            sb.append(" Ce CV pourrait etre optimise pour mieux passer les filtres ATS.");
        } else {
            sb.append(" Ce CV necessite des ameliorations importantes pour etre visible par les filtres ATS.");
        }

        return sb.toString();
    }

    private void saveHistory(Candidature candidature, String ancienStatut, String nouveauStatut) {
        saveHistory(candidature, ancienStatut, nouveauStatut, "Changement de statut automatique");
    }

    private void saveHistory(Candidature candidature, String ancienStatut, String nouveauStatut, String commentaire) {
        try {
            com.ats.backendats.dto.request.HistoriqueRecrutementRequest req =
                    new com.ats.backendats.dto.request.HistoriqueRecrutementRequest();
            req.setCandidatureId(candidature.getId());
            req.setAncienStatut(ancienStatut);
            req.setNouveauStatut(nouveauStatut);
            req.setCommentaire(commentaire != null ? commentaire : "Changement de statut automatique");
            historiqueService.createHistorique(req);
        } catch (Exception e) {
            System.err.println("Erreur historique: " + e.getMessage());
        }
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
}