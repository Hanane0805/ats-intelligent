package com.ats.backendats.controller;

import com.ats.backendats.dto.response.NotificationResponse;
import com.ats.backendats.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/utilisateur/{utilisateurId}")
    public ResponseEntity<List<NotificationResponse>> getNotificationsByUtilisateur(
            @PathVariable Long utilisateurId) {
        return ResponseEntity.ok(notificationService.getNotificationsByUtilisateur(utilisateurId));
    }

    @GetMapping("/non-lues/{utilisateurId}")
    public ResponseEntity<List<NotificationResponse>> getUnreadNotifications(
            @PathVariable Long utilisateurId) {
        return ResponseEntity.ok(notificationService.getUnreadNotifications(utilisateurId));
    }

    @PutMapping("/{id}/lire")
    public ResponseEntity<NotificationResponse> markAsLu(@PathVariable Long id) {
        return ResponseEntity.ok(notificationService.markAsLu(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long id) {
        notificationService.deleteNotification(id);
        return ResponseEntity.noContent().build();
    }
}