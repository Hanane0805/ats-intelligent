package com.ats.backendats.service;

import com.ats.backendats.dto.request.RegisterCandidatRequest;
import com.ats.backendats.dto.response.CandidatResponse;
import com.ats.backendats.exception.BadRequestException;
import com.ats.backendats.exception.ResourceNotFoundException;
import com.ats.backendats.model.Candidat;
import com.ats.backendats.repository.CandidatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CandidatService {

    private final CandidatRepository candidatRepository;

    public List<CandidatResponse> getAllCandidats() {
        return candidatRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public CandidatResponse getCandidatById(Long id) {
        Candidat candidat = candidatRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidat non trouvé avec l'ID : " + id));
        return toResponse(candidat);
    }

    @Transactional
    public CandidatResponse createCandidat(RegisterCandidatRequest request) {
        if (candidatRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Un candidat avec cet email existe déjà");
        }
        Candidat candidat = new Candidat();
        candidat.setNom(request.getNom());
        candidat.setPrenom(request.getPrenom());
        candidat.setEmail(request.getEmail());
        candidat = candidatRepository.save(candidat);
        return toResponse(candidat);
    }

    @Transactional
    public CandidatResponse updateCandidat(Long id, RegisterCandidatRequest request) {
        Candidat candidat = candidatRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidat non trouvé avec l'ID : " + id));
        candidat.setNom(request.getNom());
        candidat.setPrenom(request.getPrenom());
        if (!candidat.getEmail().equals(request.getEmail())) {
            if (candidatRepository.existsByEmail(request.getEmail())) {
                throw new BadRequestException("Un candidat avec cet email existe déjà");
            }
            candidat.setEmail(request.getEmail());
        }
        candidat = candidatRepository.save(candidat);
        return toResponse(candidat);
    }

    @Transactional
    public void deleteCandidat(Long id) {
        if (!candidatRepository.existsById(id)) {
            throw new ResourceNotFoundException("Candidat non trouvé avec l'ID : " + id);
        }
        candidatRepository.deleteById(id);
    }

    private CandidatResponse toResponse(Candidat c) {
        return CandidatResponse.builder()
                .id(c.getId())
                .nom(c.getNom())
                .prenom(c.getPrenom())
                .email(c.getEmail())
                .build();
    }
}