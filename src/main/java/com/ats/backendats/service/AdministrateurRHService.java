package com.ats.backendats.service;

import com.ats.backendats.dto.AdministrateurRHResponse;
import com.ats.backendats.dto.RegisterAdministrateurRequest;
import com.ats.backendats.exception.ResourceNotFoundException;
import com.ats.backendats.model.AdministrateurRH;
import com.ats.backendats.repository.AdministrateurRHRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdministrateurRHService {

    private final AdministrateurRHRepository administrateurRHRepository;
    private final PasswordEncoder passwordEncoder;

    public AdministrateurRHService(AdministrateurRHRepository administrateurRHRepository,
                                   PasswordEncoder passwordEncoder) {
        this.administrateurRHRepository = administrateurRHRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public AdministrateurRHResponse create(RegisterAdministrateurRequest request) {
        AdministrateurRH admin = new AdministrateurRH();
        admin.setNom(request.getNom());
        admin.setPrenom(request.getPrenom());
        admin.setEmail(request.getEmail());
        admin.setMotDePasse(passwordEncoder.encode(request.getMotDePasse()));
        admin.setEstActif(true);

        admin = administrateurRHRepository.save(admin);
        return mapToResponse(admin);
    }

    public List<AdministrateurRHResponse> getAll() {
        return administrateurRHRepository.findAll().stream()
                .map(this::mapToResponse)
                .toList();
    }

    public AdministrateurRHResponse getById(Long id) {
        AdministrateurRH admin = administrateurRHRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Administrateur non trouvé avec l'id : " + id));
        return mapToResponse(admin);
    }

    public AdministrateurRHResponse update(Long id, RegisterAdministrateurRequest request) {
        AdministrateurRH admin = administrateurRHRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Administrateur non trouvé avec l'id : " + id));
        admin.setNom(request.getNom());
        admin.setPrenom(request.getPrenom());
        admin.setEmail(request.getEmail());
        admin.setMotDePasse(passwordEncoder.encode(request.getMotDePasse()));

        admin = administrateurRHRepository.save(admin);
        return mapToResponse(admin);
    }

    public void delete(Long id) {
        AdministrateurRH admin = administrateurRHRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Administrateur non trouvé avec l'id : " + id));
        administrateurRHRepository.delete(admin);
    }

    private AdministrateurRHResponse mapToResponse(AdministrateurRH admin) {
        AdministrateurRHResponse response = new AdministrateurRHResponse();
        response.setId(admin.getId());
        response.setNom(admin.getNom());
        response.setPrenom(admin.getPrenom());
        response.setEmail(admin.getEmail());
        response.setEstActif(admin.getEstActif());
        return response;
    }
}