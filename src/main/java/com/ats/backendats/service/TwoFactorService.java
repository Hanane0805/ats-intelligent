package com.ats.backendats.service;

import com.ats.backendats.model.OtpCode;
import com.ats.backendats.repository.OtpCodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class TwoFactorService {

    private final OtpCodeRepository otpCodeRepository;

    // Optional: injected only if SMTP is configured
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    @Value("${app.2fa.enabled:true}")
    private boolean twoFaEnabled;

    private static final SecureRandom random = new SecureRandom();

    public OtpCode generateAndSendOtp(String email, boolean rememberMe) {
        // Delete any existing OTPs for this email
        otpCodeRepository.deleteAllByEmail(email);

        // Generate 6-digit code
        String code = String.format("%06d", random.nextInt(999999));

        OtpCode otp = new OtpCode();
        otp.setEmail(email);
        otp.setCode(code);
        otp.setExpireAt(LocalDateTime.now().plusMinutes(10));
        otp.setUsed(false);
        otp.setRememberMe(rememberMe);
        otp = otpCodeRepository.save(otp);

        // Try sending email, fallback to console log
        try {
            if (mailSender != null && fromEmail != null && !fromEmail.isBlank()) {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromEmail);
                message.setTo(email);
                message.setSubject("🔐 Votre code de vérification ATS Intelligent");
                message.setText(
                    "Bonjour,\n\n" +
                    "Votre code de vérification est : " + code + "\n\n" +
                    "Ce code expire dans 10 minutes.\n\n" +
                    "Si vous n'avez pas demandé ce code, ignorez cet email.\n\n" +
                    "— L'équipe ATS Intelligent"
                );
                mailSender.send(message);
                log.info("2FA OTP sent by email to: {}", email);
            } else {
                log.warn("SMTP not configured. OTP for {} : {}", email, code);
            }
        } catch (Exception e) {
            log.error("Failed to send OTP email, code logged: {} for {}", code, email);
        }

        return otp;
    }

    public boolean verifyOtp(String email, String code) {
        return otpCodeRepository.findTopByEmailOrderByExpireAtDesc(email)
                .filter(otp -> !otp.isUsed())
                .filter(otp -> otp.getExpireAt().isAfter(LocalDateTime.now()))
                .filter(otp -> otp.getCode().equals(code))
                .isPresent();
    }

    public void markOtpAsUsed(String email) {
        otpCodeRepository.findTopByEmailOrderByExpireAtDesc(email)
                .ifPresent(otp -> {
                    otp.setUsed(true);
                    otpCodeRepository.save(otp);
                });
    }

    public boolean isRememberMe(String email) {
        return otpCodeRepository.findTopByEmailOrderByExpireAtDesc(email)
                .map(OtpCode::isRememberMe)
                .orElse(false);
    }
}
