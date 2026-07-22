package com.ats.backendats.service;

import com.ats.backendats.dto.request.NotificationRequest;
import com.ats.backendats.dto.response.NotificationResponse;
import com.ats.backendats.exception.ResourceNotFoundException;
import com.ats.backendats.model.Notification;
import com.ats.backendats.model.Utilisateur;
import com.ats.backendats.repository.NotificationRepository;
import com.ats.backendats.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UtilisateurRepository utilisateurRepository;

    public List<NotificationResponse> getNotificationsByUtilisateur(Long utilisateurId) {
        return notificationRepository.findByUtilisateur_Id(utilisateurId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<NotificationResponse> getUnreadNotifications(Long utilisateurId) {
        return notificationRepository.findByUtilisateur_IdAndEstLuFalse(utilisateurId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public NotificationResponse createNotification(NotificationRequest request) {
        Utilisateur utilisateur = utilisateurRepository.findById(request.getUtilisateurId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Utilisateur non trouvé avec l'ID : " + request.getUtilisateurId()));

        Notification notification = new Notification();
        notification.setTitre(request.getTitre());
        notification.setMessage(request.getMessage());
        notification.setDateCreation(LocalDateTime.now());
        notification.setEstLu(false);
        notification.setUtilisateur(utilisateur);
        notification = notificationRepository.save(notification);
        return toResponse(notification);
    }

    @Transactional
    public NotificationResponse markAsLu(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification non trouvée avec l'ID : " + id));
        notification.setEstLu(true);
        notification = notificationRepository.save(notification);
        return toResponse(notification);
    }

    @Transactional
    public void deleteNotification(Long id) {
        if (!notificationRepository.existsById(id)) {
            throw new ResourceNotFoundException("Notification non trouvée avec l'ID : " + id);
        }
        notificationRepository.deleteById(id);
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .titre(n.getTitre())
                .message(n.getMessage())
                .dateCreation(n.getDateCreation())
                .estLu(n.getEstLu())
                .utilisateurId(n.getUtilisateur() != null ? n.getUtilisateur().getId() : null)
                .build();
    }
}