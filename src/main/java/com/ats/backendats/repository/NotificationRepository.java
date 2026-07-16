package com.ats.backendats.repository;

import com.ats.backendats.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUtilisateur_Id(Long utilisateurId);
    List<Notification> findByUtilisateur_IdAndEstLuFalse(Long utilisateurId);
}