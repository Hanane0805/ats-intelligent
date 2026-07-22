package com.ats.backendats.repository;

import com.ats.backendats.model.OtpCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface OtpCodeRepository extends JpaRepository<OtpCode, Long> {

    Optional<OtpCode> findTopByEmailOrderByExpireAtDesc(String email);

    @Modifying
    @Transactional
    @Query("DELETE FROM OtpCode o WHERE o.email = :email")
    void deleteAllByEmail(String email);
}
