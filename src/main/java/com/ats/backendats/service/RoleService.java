package com.ats.backendats.service;

import com.ats.backendats.dto.request.RoleRequest;
import com.ats.backendats.dto.response.RoleResponse;
import com.ats.backendats.model.Role;
import com.ats.backendats.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;

    public List<RoleResponse> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public RoleResponse getRoleById(Long id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Role non trouvé"));
        return mapToResponse(role);
    }

    public RoleResponse createRole(RoleRequest request) {
        if (roleRepository.findByNomRole(request.getNomRole()).isPresent()) {
            throw new RuntimeException("Ce rôle existe déjà");
        }
        Role role = new Role();
        role.setNomRole(request.getNomRole());
        role.setDescription(request.getDescription());
        return mapToResponse(roleRepository.save(role));
    }

    public RoleResponse updateRole(Long id, RoleRequest request) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Role non trouvé"));
        role.setDescription(request.getDescription());
        // Normalement on ne modifie pas le nom du rôle s'il est utilisé en dur, mais permettons-le
        role.setNomRole(request.getNomRole());
        return mapToResponse(roleRepository.save(role));
    }

    public void deleteRole(Long id) {
        roleRepository.deleteById(id);
    }

    private RoleResponse mapToResponse(Role role) {
        return RoleResponse.builder()
                .id(role.getId())
                .nomRole(role.getNomRole())
                .description(role.getDescription())
                .build();
    }
}
