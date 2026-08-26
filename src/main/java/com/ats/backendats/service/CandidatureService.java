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

        Long candidatId = candidature.getCandidat().getId();
        log.info("[Analyse RAG] Recherche CV pour candidat ID={}...", candidatId);
        List<DocumentCV> cvs = documentCVRepository.findByCandidatId(candidatId);
        if (cvs.isEmpty()) {
            log.warn("[Analyse RAG] Aucun CV pour candidat ID={}", candidatId);
            candidature.setStatut(StatutCandidature.EN_ATTENTE);
            candidatureRepository.save(candidature);
            throw new BadRequestException("Aucun CV trouve pour ce candidat (ID: " + candidatId + "). Veuillez d'abord televerser un CV.");
        }

        DocumentCV cvDoc = cvs.get(0);
        for (DocumentCV c : cvs) {
            if (c.getDateUpload() != null && cvDoc.getDateUpload() != null
                    && c.getDateUpload().isAfter(cvDoc.getDateUpload())) {
                cvDoc = c;
            }
        }

        String cvText = cvDoc.getTexteBrut();
        if (cvText == null || cvText.isBlank()) {
            log.warn("[Analyse RAG] CV ID={} vide pour candidat ID={}", cvDoc.getId(), candidatId);
            candidature.setStatut(StatutCandidature.EN_ATTENTE);
            candidatureRepository.save(candidature);
            throw new BadRequestException("Le CV de ce candidat est vide ou illisible (Document ID: " + cvDoc.getId() + "). Veuillez televerser un CV valide.");
        }
        log.info("[Analyse RAG] CV trouve: ID={}, {} caracteres", cvDoc.getId(), cvText.length());

        String jobDescription = poste.getTitre();
        if (poste.getDescription() != null) {
            jobDescription += " " + poste.getDescription();
        }

        try {
            Map<String, Object> result = flaskAiService.analyzeRag(
                    cvText, jobDescription, String.valueOf(candidatId)
            );

            // ================================================================
            // SCORE 1 : Qualite ATS du CV
            // ================================================================
            double atsScore = 0.0;
            String atsVerdict = "Non disponible";
            String atsMethod = "N/A";
            double atsHeuristicScore = 0.0;
            List<String> pointsForts = new ArrayList<>();
            List<String> aAmeliorer = new ArrayList<>();

            Object atsObj = result.get("ats_score");
            if (atsObj instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> ats = (Map<String, Object>) atsObj;
                atsScore = parseDouble(ats.get("score"), 0.0);
                atsVerdict = (String) ats.getOrDefault("verdict", "Non disponible");
                atsMethod = (String) ats.getOrDefault("method", "N/A");
                atsHeuristicScore = parseDouble(ats.get("heuristic_score"), 0.0);

                if (ats.get("points_forts") instanceof List) {
                    @SuppressWarnings("unchecked")
                    List<Object> raw = (List<Object>) ats.get("points_forts");
                    for (Object o : raw) pointsForts.add(String.valueOf(o));
                }
                if (ats.get("a_ameliorer") instanceof List) {
                    @SuppressWarnings("unchecked")
                    List<Object> raw = (List<Object>) ats.get("a_ameliorer");
                    for (Object o : raw) aAmeliorer.add(String.valueOf(o));
                }
            }

            // ================================================================
            // SCORE 2 : Compatibilite CV <-> Offre
            // ================================================================
            double compatScore = 0.0;
            String compatVerdict = "Non disponible";
            double semanticSim = 0.0;
            double skillMatch = 0.0;
            double expMatch = 0.0;
            double kwMatch = 0.0;
            int cvExpYears = 0;
            int reqExpYears = 0;
            List<String> matchedSkills = new ArrayList<>();
            List<String> missingSkills = new ArrayList<>();
            String compatRecommandation = "";

            Object compatObj = result.get("compatibility_score");
            if (compatObj instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> compat = (Map<String, Object>) compatObj;
                compatScore = parseDouble(compat.get("score"), 0.0);
                compatVerdict = (String) compat.getOrDefault("verdict", "Non disponible");
                semanticSim = parseDouble(compat.get("semantic_similarity"), 0.0);
                skillMatch = parseDouble(compat.get("skill_match"), 0.0);
                expMatch = parseDouble(compat.get("experience_match"), 0.0);
                kwMatch = parseDouble(compat.get("keyword_match"), 0.0);
                cvExpYears = (int) parseDouble(compat.get("cv_experience_years"), 0.0);
                reqExpYears = (int) parseDouble(compat.get("required_experience_years"), 0.0);

                if (compat.get("matched_skills") instanceof List) {
                    @SuppressWarnings("unchecked")
                    List<Object> raw = (List<Object>) compat.get("matched_skills");
                    for (Object o : raw) matchedSkills.add(String.valueOf(o));
                }
                if (compat.get("missing_skills") instanceof List) {
                    @SuppressWarnings("unchecked")
                    List<Object> raw = (List<Object>) compat.get("missing_skills");
                    for (Object o : raw) missingSkills.add(String.valueOf(o));
                }
                compatRecommandation = (String) compat.getOrDefault("recommandation", "");
            }

            // ================================================================
            // ANALYSE LLM
            // ================================================================
            boolean ollamaAvailable = Boolean.TRUE.equals(result.get("ollama_available"));
            Object llmAnalysisObj = result.get("llm_analysis");
            String llmAnalysis = null;
            boolean llmAvailable = ollamaAvailable && llmAnalysisObj != null;

            if (llmAnalysisObj instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> llmParsed = (Map<String, Object>) llmAnalysisObj;

                if (llmParsed.get("points_forts") instanceof List) {
                    @SuppressWarnings("unchecked")
                    List<Object> raw = (List<Object>) llmParsed.get("points_forts");
                    for (Object o : raw) pointsForts.add(String.valueOf(o));
                }
                if (llmParsed.get("faiblesses") instanceof List) {
                    @SuppressWarnings("unchecked")
                    List<Object> raw = (List<Object>) llmParsed.get("faiblesses");
                    for (Object o : raw) aAmeliorer.add(String.valueOf(o));
                }
                if (llmParsed.get("recommandations") instanceof List) {
                    @SuppressWarnings("unchecked")
                    List<Object> raw = (List<Object>) llmParsed.get("recommandations");
                    for (Object o : raw) aAmeliorer.add(String.valueOf(o));
                }
                llmAnalysis = (String) llmParsed.get("analyse_detaillee");
                if (llmAnalysis == null) {
                    llmAnalysis = llmParsed.toString();
                }
            } else if (llmAnalysisObj instanceof String) {
                llmAnalysis = (String) llmAnalysisObj;
                try {
                    com.fasterxml.jackson.databind.ObjectMapper om = new com.fasterxml.jackson.databind.ObjectMapper();
                    @SuppressWarnings("unchecked")
                    Map<String, Object> llmParsed = om.readValue(llmAnalysis, Map.class);
                    if (llmParsed.get("points_forts") instanceof List) {
                        @SuppressWarnings("unchecked")
                        List<String> pForts = (List<String>) llmParsed.get("points_forts");
                        if (!pForts.isEmpty()) pointsForts = pForts;
                    }
                    if (llmParsed.get("faiblesses") instanceof List) {
                        @SuppressWarnings("unchecked")
                        List<String> pFaibles = (List<String>) llmParsed.get("faiblesses");
                        aAmeliorer.addAll(pFaibles);
                    }
                    if (llmParsed.get("recommandations") instanceof List) {
                        @SuppressWarnings("unchecked")
                        List<String> pReco = (List<String>) llmParsed.get("recommandations");
                        aAmeliorer.addAll(pReco);
                    }
                    String detail = (String) llmParsed.get("analyse_detaillee");
                    if (detail != null) llmAnalysis = detail;
                } catch (Exception parseEx) {
                    log.debug("[Analyse RAG] LLM response non-JSON, texte brut utilise");
                }
            }

            // ================================================================
            // CONSTRUIRE LA RECOMMANDATION
            // ================================================================
            String forcesText = !pointsForts.isEmpty()
                    ? String.join(", ", pointsForts)
                    : "Aucun point fort identifie";

            String faiblessesText = !aAmeliorer.isEmpty()
                    ? String.join(", ", aAmeliorer)
                    : "Aucune faiblesse majeure identifiee";

            String recommandationFinale;

            recommandationFinale = String.format(
                    "[Compatibilite: %s - %.1f%% | Qualite ATS: %.1f%%] ",
                    compatVerdict, compatScore, atsScore
            );

            if (compatScore > 0) {
                recommandationFinale += String.format(
                        "Details: Semantique=%.1f%%, Competences=%.1f%%, Experience=%.1f%%, Mots-cles=%.1f%%. ",
                        semanticSim, skillMatch, expMatch, kwMatch
                );
            }

            if (!matchedSkills.isEmpty()) {
                String skills = String.join(", ", matchedSkills.subList(0, Math.min(8, matchedSkills.size())));
                recommandationFinale += "Competences correspondantes: " + skills + ". ";
            }
            if (!missingSkills.isEmpty()) {
                String missing = String.join(", ", missingSkills.subList(0, Math.min(6, missingSkills.size())));
                recommandationFinale += "Competences manquantes: " + missing + ". ";
            }

            if (reqExpYears > 0) {
                recommandationFinale += String.format("Experience: %d ans (requis: %d). ", cvExpYears, reqExpYears);
            }

            if (llmAnalysis != null && !llmAnalysis.isBlank()) {
                recommandationFinale += "Analyse IA: " + llmAnalysis;
            } else {
                recommandationFinale += "Analyse IA non disponible (Ollama " + (ollamaAvailable ? "echec" : "indisponible") + ").";
            }

            // ================================================================
            // SAUVEGARDER
            // ================================================================
            AnalyseIA analyse = new AnalyseIA();
            analyse.setScore(compatScore > 0 ? compatScore : atsScore);
            analyse.setSyntheseForces(forcesText);
            analyse.setSyntheseFaiblesses(faiblessesText);
            analyse.setRecommandation(recommandationFinale);
            analyse.setDateAnalyse(java.time.LocalDate.now());
            analyse = analyseIARepository.save(analyse);

            candidature.setAnalyseIA(analyse);
            candidature.setScoreCompatibilite((compatScore > 0 ? compatScore : atsScore) / 100.0);
            candidature.setStatut(StatutCandidature.EN_ATTENTE);
            candidature = candidatureRepository.save(candidature);

            saveHistory(candidature, "EN_ANALYSE", "EN_ATTENTE");

            log.info("[Analyse RAG] Candidature ID={} | ATS: {}% ({}) | Compatibilite: {}% ({}) | LLM: {} | Ollama: {}",
                    candidatureId, atsScore, atsVerdict, compatScore, compatVerdict,
                    llmAvailable ? "OUI" : "NON",
                    ollamaAvailable ? "OUI" : "NON");

            return toResponse(candidature);

        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("[Analyse RAG] Erreur : {}", e.getMessage(), e);
            candidature.setStatut(StatutCandidature.EN_ATTENTE);
            candidatureRepository.save(candidature);
            throw new BadRequestException("L'analyse IA a echoue : " + e.getMessage());
        }
    }

    private double parseDouble(Object value, double defaultValue) {
        if (value == null) return defaultValue;
        if (value instanceof Number) return ((Number) value).doubleValue();
        try {
            return Double.parseDouble(value.toString());
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    private String buildRecommendation(double totalScore, double semantic, double skillMatch,
                                       double expMatch, int cvExp, int requiredExp,
                                       List<String> matchedSkills, List<String> missingSkills) {
        StringBuilder sb = new StringBuilder();

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

        if (matchedSkills != null && !matchedSkills.isEmpty()) {
            String skills = String.join(", ", matchedSkills.subList(0, Math.min(8, matchedSkills.size())));
            sb.append(" Competences correspondantes : ").append(skills).append(".");
        }
        if (missingSkills != null && !missingSkills.isEmpty()) {
            String missing = String.join(", ", missingSkills.subList(0, Math.min(6, missingSkills.size())));
            sb.append(" Competences manquantes : ").append(missing).append(".");
        }

        if (requiredExp > 0) {
            if (cvExp >= requiredExp) {
                sb.append(String.format(" Experience conforme (%d ans vs %d requis).", cvExp, requiredExp));
            } else {
                sb.append(String.format(" Experience insuffisante (%d ans vs %d requis).", cvExp, requiredExp));
            }
        }

        if (totalScore >= 75) {
            sb.append(" Ce candidat merite une entrevue approfondie.");
        } else if (totalScore >= 55) {
            sb.append(" Candidat a envisager pour un entretien.");
        } else {
            sb.append(" D'autres candidats plus adaptes devraient etre privilgies.");
        }

        return sb.toString();
    }

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