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
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.converter.BeanOutputConverter;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CandidatureService {

    private final CandidatureRepository candidatureRepository;
    private final CandidatRepository candidatRepository;
    private final FichePosteRepository fichePosteRepository;
    private final AnalyseIARepository analyseIARepository;
    private final DocumentCVRepository documentCVRepository;
    private final N8nWebhookService n8nWebhookService;
    private final ChatClient chatClient;
    private final EmbeddingModel embeddingModel;

    public CandidatureService(CandidatureRepository candidatureRepository,
                              CandidatRepository candidatRepository,
                              FichePosteRepository fichePosteRepository,
                              AnalyseIARepository analyseIARepository,
                              DocumentCVRepository documentCVRepository,
                              N8nWebhookService n8nWebhookService,
                              ChatClient.Builder chatClientBuilder,
                              EmbeddingModel embeddingModel) {
        this.candidatureRepository = candidatureRepository;
        this.candidatRepository = candidatRepository;
        this.fichePosteRepository = fichePosteRepository;
        this.analyseIARepository = analyseIARepository;
        this.documentCVRepository = documentCVRepository;
        this.n8nWebhookService = n8nWebhookService;
        this.chatClient = chatClientBuilder.build();
        this.embeddingModel = embeddingModel;
    }

    public List<CandidatureResponse> getAllCandidatures() {
        return candidatureRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public CandidatureResponse getCandidatureById(Long id) {
        Candidature candidature = candidatureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidature non trouvée avec l'ID : " + id));
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
                .orElseThrow(() -> new ResourceNotFoundException("Candidat non trouvé avec l'ID : " + request.getCandidatId()));
        FichePoste fichePoste = fichePosteRepository.findById(request.getFichePosteId())
                .orElseThrow(() -> new ResourceNotFoundException("Fiche de poste non trouvée avec l'ID : " + request.getFichePosteId()));
        if (candidatureRepository.existsByCandidatIdAndFichePosteId(request.getCandidatId(), request.getFichePosteId())) {
            throw new BadRequestException("Ce candidat a déjà postulé à cette offre");
        }
        Candidature candidature = new Candidature();
        candidature.setCandidat(candidat);
        candidature.setFichePoste(fichePoste);
        candidature.setStatut(StatutCandidature.EN_ATTENTE);
        candidature.setDatePostulation(java.time.LocalDate.now());
        candidature = candidatureRepository.save(candidature);
        n8nWebhookService.notifyCandidatureCreated(candidature);
        return toResponse(candidature);
    }

    @Transactional
    public CandidatureResponse updateCandidature(Long id, CandidatureUpdateRequest request) {
        Candidature candidature = candidatureRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidature non trouvée avec l'ID : " + id));
        String ancienStatut = candidature.getStatut() != null ? candidature.getStatut().name() : null;
        if (request.getStatut() != null) {
            candidature.setStatut(StatutCandidature.valueOf(request.getStatut().toUpperCase()));
        }
        if (request.getScoreCompatibilite() != null) {
            candidature.setScoreCompatibilite(request.getScoreCompatibilite());
        }
        candidature = candidatureRepository.save(candidature);
        n8nWebhookService.notifyCandidatureUpdated(candidature, ancienStatut);
        return toResponse(candidature);
    }

    @Transactional
    public void deleteCandidature(Long id) {
        if (!candidatureRepository.existsById(id)) {
            throw new ResourceNotFoundException("Candidature non trouvée avec l'ID : " + id);
        }
        candidatureRepository.deleteById(id);
    }

    public record AnalyseOutput(Double score, String syntheseForces, String syntheseFaiblesses, String recommandation) {}

    @Transactional
    public CandidatureResponse analyzeCandidature(Long candidatureId) {
        Candidature candidature = candidatureRepository.findById(candidatureId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidature non trouvée avec l'ID : " + candidatureId));
        
        candidature.setStatut(StatutCandidature.EN_ANALYSE);
        candidatureRepository.save(candidature);

        FichePoste poste = candidature.getFichePoste();
        if (poste == null) throw new BadRequestException("Aucune fiche de poste associée.");

        List<DocumentCV> cvs = documentCVRepository.findByCandidatId(candidature.getCandidat().getId());
        String cvText = "Aucun CV fourni.";
        if (!cvs.isEmpty()) {
            cvText = cvs.get(0).getTexteBrut();
        }
        if (cvText != null && cvText.length() > 3000) {
            cvText = cvText.substring(0, 3000); // Limit size for lightweight LLM
        }

        try {
            // 1. CALCULATE SCORE USING VECTOR EMBEDDINGS (100% Reliable and strict)
            float[] posteVector = embeddingModel.embed(poste.getTitre() + " " + poste.getDescription());
            float[] cvVector = embeddingModel.embed(cvText);
            double dotProduct = 0.0;
            double normA = 0.0;
            double normB = 0.0;
            for (int i = 0; i < posteVector.length; i++) {
                dotProduct += posteVector[i] * cvVector[i];
                normA += Math.pow(posteVector[i], 2);
                normB += Math.pow(cvVector[i], 2);
            }
            double cosineSimilarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
            // Log the raw cosine similarity to see what values we actually get
            System.out.println(">>> RAW COSINE SIMILARITY: " + cosineSimilarity);
            
            // Text embeddings often have a baseline of ~0.5. 
            // A good match is often ~0.7 to 0.85. A bad match is ~0.4 to 0.55.
            // Let's use a smoother formula that gives ~85-100% for >0.75, and <30% for <0.55
            double calculatedScore = 0.0;
            if (cosineSimilarity > 0.75) {
                calculatedScore = 80.0 + ((cosineSimilarity - 0.75) * 100.0); // 0.75 -> 80, 0.95 -> 100
            } else if (cosineSimilarity > 0.60) {
                calculatedScore = 50.0 + ((cosineSimilarity - 0.60) * 200.0); // 0.60 -> 50, 0.75 -> 80
            } else if (cosineSimilarity > 0.50) {
                calculatedScore = 20.0 + ((cosineSimilarity - 0.50) * 300.0); // 0.50 -> 20, 0.60 -> 50
            } else {
                calculatedScore = Math.max(0, cosineSimilarity * 40.0); // <0.50 -> <20
            }
            
            if (calculatedScore > 100) calculatedScore = 100.0;
            System.out.println(">>> SCALED SCORE: " + calculatedScore);

            // 2. ASK LLM ONLY FOR TEXT GENERATION
            BeanOutputConverter<AnalyseOutput> converter = new BeanOutputConverter<>(AnalyseOutput.class);
            String prompt = "Tu es un expert RH. Fais une brève synthèse des points forts et faibles de ce CV par rapport au poste.\n\n" +
                    "OFFRE D'EMPLOI:\n" + poste.getTitre() + "\n" + poste.getDescription() + "\n\n" +
                    "CV:\n" + cvText + "\n\n" +
                    "Génère une réponse JSON valide. Mets '0' dans le champ score. Concentre-toi sur le texte. SOIS TRÈS BREF.\n\n" +
                    converter.getFormat();

            String response = chatClient.prompt().user(prompt).call().content();
            
            if (response != null) {
                response = response.trim();
                if (!response.endsWith("}")) {
                    if (response.endsWith("\"")) {
                        response += "\n}";
                    } else if (response.endsWith(",")) {
                        response = response.substring(0, response.length() - 1) + "\n}";
                    } else {
                        response += "\"\n}";
                    }
                }
            }
            
            AnalyseOutput result = converter.convert(response);

            AnalyseIA analyse = new AnalyseIA();
            analyse.setScore(Math.round(calculatedScore * 10.0) / 10.0); // Use the vector score, rounded
            analyse.setSyntheseForces(result.syntheseForces());
            analyse.setSyntheseFaiblesses(result.syntheseFaiblesses());
            analyse.setRecommandation(result.recommandation());
            analyse.setDateAnalyse(java.time.LocalDate.now());
            
            analyse = analyseIARepository.save(analyse);
            
            candidature.setAnalyseIA(analyse);
            candidature.setScoreCompatibilite(analyse.getScore() / 100.0); // Normalize to 0-1 for DB
            candidature.setStatut(StatutCandidature.EN_ATTENTE);
            candidature = candidatureRepository.save(candidature);

            n8nWebhookService.notifyCandidatureUpdated(candidature, "EN_ANALYSE");
            return toResponse(candidature);

        } catch (Exception e) {
            System.err.println("Erreur LLM lors de l'analyse : " + e.getMessage());
            candidature.setStatut(StatutCandidature.EN_ATTENTE);
            candidatureRepository.save(candidature);
            throw new BadRequestException("L'analyse IA a échoué : " + e.getMessage());
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