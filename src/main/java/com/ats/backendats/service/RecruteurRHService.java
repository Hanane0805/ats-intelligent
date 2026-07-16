package com.ats.backendats.service;

import com.ats.backendats.dto.request.RegisterRecruteurRequest;
import com.ats.backendats.dto.response.RecruteurRHResponse;
import com.ats.backendats.exception.BadRequestException;
import com.ats.backendats.exception.ResourceNotFoundException;
import com.ats.backendats.model.RecruteurRH;
import com.ats.backendats.repository.RecruteurRHRepository;
import com.ats.backendats.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecruteurRHService {

    private final RecruteurRHRepository recruteurRHRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;

    public List<RecruteurRHResponse> getAllRecruteurs() {
        return recruteurRHRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public RecruteurRHResponse getRecruteurById(Long id) {
        RecruteurRH recruteur = recruteurRHRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Recruteur non trouvé avec l'ID : " + id));
        return toResponse(recruteur);
    }

    @Transactional
    public RecruteurRHResponse createRecruteur(RegisterRecruteurRequest request) {
        if (utilisateurRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Un utilisateur avec cet email existe déjà");
        }
        RecruteurRH recruteur = new RecruteurRH();
        recruteur.setNom(request.getNom());
        recruteur.setPrenom(request.getPrenom());
        recruteur.setEmail(request.getEmail());
        recruteur.setMotDePasse(passwordEncoder.encode(request.getMotDePasse()));
        recruteur.setDepartement(request.getDepartement());
        recruteur.setEstActif(true);
        recruteur = recruteurRHRepository.save(recruteur);
        return toResponse(recruteur);
    }

    @Transactional
    public RecruteurRHResponse updateRecruteur(Long id, RegisterRecruteurRequest request) {
        RecruteurRH recruteur = recruteurRHRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Recruteur non trouvé avec l'ID : " + id));
        recruteur.setNom(request.getNom());
        recruteur.setPrenom(request.getPrenom());
        recruteur.setDepartement(request.getDepartement());
        if (!recruteur.getEmail().equals(request.getEmail())) {
            if (utilisateurRepository.existsByEmail(request.getEmail())) {
                throw new BadRequestException("Un utilisateur avec cet email existe déjà");
            }
            recruteur.setEmail(request.getEmail());
        }
        if (request.getMotDePasse() != null && !request.getMotDePasse().isBlank()) {
            recruteur.setMotDePasse(passwordEncoder.encode(request.getMotDePasse()));
        }
        recruteur = recruteurRHRepository.save(recruteur);
        return toResponse(recruteur);
    }

    @Transactional
    public void deleteRecruteur(Long id) {
        if (!recruteurRHRepository.existsById(id)) {
            throw new ResourceNotFoundException("Recruteur non trouvé avec l'ID : " + id);
        }
        recruteurRHRepository.deleteById(id);
    }

    private RecruteurRHResponse toResponse(RecruteurRH r) {
        return RecruteurRHResponse.builder()
                .id(r.getId())
                .nom(r.getNom())
                .prenom(r.getPrenom())
                .email(r.getEmail())
                .departement(r.getDepartement())
                .estActif(r.getEstActif())
                .build();
    }
}