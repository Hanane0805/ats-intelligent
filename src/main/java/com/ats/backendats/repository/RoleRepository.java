package com.ats.backendats.repository;

import com.ats.backendats.model.Role;
import com.ats.backendats.model.NomRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByNomRole(NomRole nomRole);
}