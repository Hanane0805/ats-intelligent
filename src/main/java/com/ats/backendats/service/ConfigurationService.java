package com.ats.backendats.service;

import com.ats.backendats.dto.request.ConfigurationRequest;
import com.ats.backendats.dto.response.ConfigurationResponse;
import com.ats.backendats.exception.ResourceNotFoundException;
import com.ats.backendats.model.ConfigurationSysteme;
import com.ats.backendats.repository.ConfigurationSystemeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConfigurationService {

    private final ConfigurationSystemeRepository configRepository;

    public List<ConfigurationResponse> getAllConfigurations() {
        return configRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public ConfigurationResponse getConfigurationByCle(String cle) {
        ConfigurationSysteme config = configRepository.findByCleParametre(cle)
                .orElseThrow(() -> new ResourceNotFoundException("Configuration non trouvée : " + cle));
        return toResponse(config);
    }

    @Transactional
    public ConfigurationResponse createOrUpdateConfiguration(String cle, ConfigurationRequest request) {
        ConfigurationSysteme config = configRepository.findByCleParametre(cle)
                .orElse(new ConfigurationSysteme());
        config.setCleParametre(cle);
        config.setValeurParametre(request.getValeurParametre());
        config = configRepository.save(config);
        return toResponse(config);
    }

    @Transactional
    public void deleteConfiguration(Long id) {
        if (!configRepository.existsById(id)) {
            throw new ResourceNotFoundException("Configuration non trouvée avec l'ID : " + id);
        }
        configRepository.deleteById(id);
    }

    private ConfigurationResponse toResponse(ConfigurationSysteme c) {
        return ConfigurationResponse.builder()
                .id(c.getId())
                .cleParametre(c.getCleParametre())
                .valeurParametre(c.getValeurParametre())
                .build();
    }
}