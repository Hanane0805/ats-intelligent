package com.ats.backendats.service;

import com.ats.backendats.config.N8nProperties;
import com.ats.backendats.dto.n8n.N8nCandidatureEvent;
import com.ats.backendats.model.Candidature;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;

@Service
@RequiredArgsConstructor
@Slf4j
public class N8nWebhookService {

    private final N8nProperties n8nProperties;
    private final RestTemplate n8nRestTemplate;

    @Async
    public void notifyCandidatureCreated(Candidature candidature) {
        sendEvent(n8nProperties.getWebhooks().getCandidatureCreated(), buildEvent(
                "CANDIDATURE_CREATED",
                candidature,
                null
        ));
    }

    @Async
    public void notifyCandidatureUpdated(Candidature candidature, String ancienStatut) {
        sendEvent(n8nProperties.getWebhooks().getCandidatureUpdated(), buildEvent(
                "CANDIDATURE_UPDATED",
                candidature,
                ancienStatut
        ));
    }

    private N8nCandidatureEvent buildEvent(String eventType,
                                           Candidature candidature,
                                           String ancienStatut) {
        return N8nCandidatureEvent.builder()
                .eventType(eventType)
                .candidatureId(candidature.getId())
                .candidatId(candidature.getCandidat() != null ? candidature.getCandidat().getId() : null)
                .candidatNom(candidature.getCandidat() != null
                        ? candidature.getCandidat().getNom() + " " + candidature.getCandidat().getPrenom()
                        : null)
                .candidatEmail(candidature.getCandidat() != null ? candidature.getCandidat().getEmail() : null)
                .fichePosteId(candidature.getFichePoste() != null ? candidature.getFichePoste().getId() : null)
                .fichePosteTitre(candidature.getFichePoste() != null ? candidature.getFichePoste().getTitre() : null)
                .statut(candidature.getStatut() != null ? candidature.getStatut().name() : null)
                .ancienStatut(ancienStatut)
                .datePostulation(candidature.getDatePostulation())
                .scoreCompatibilite(candidature.getScoreCompatibilite())
                .timestamp(Instant.now().toString())
                .build();
    }

    private void sendEvent(String webhookUrl, N8nCandidatureEvent event) {
        if (!n8nProperties.isEnabled()) {
            log.debug("n8n désactivé, événement {} ignoré", event.getEventType());
            return;
        }
        if (webhookUrl == null || webhookUrl.isBlank()) {
            log.warn("URL webhook n8n non configurée pour {}", event.getEventType());
            return;
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            n8nRestTemplate.postForEntity(webhookUrl, new HttpEntity<>(event, headers), Void.class);
            log.info("Événement {} envoyé à n8n pour candidature {}", event.getEventType(), event.getCandidatureId());
        } catch (Exception e) {
            log.error("Erreur envoi webhook n8n ({}): {}", event.getEventType(), e.getMessage());
        }
    }
}
