package com.ats.backendats.config;

import com.ats.backendats.model.AdministrateurRH;
import com.ats.backendats.model.RecruteurRH;
import com.ats.backendats.repository.AdministrateurRHRepository;
import com.ats.backendats.repository.RecruteurRHRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final RecruteurRHRepository recruteurRepository;
    private final AdministrateurRHRepository administrateurRepository;

    public CustomUserDetailsService(RecruteurRHRepository recruteurRepository,
                                    AdministrateurRHRepository administrateurRepository) {
        this.recruteurRepository = recruteurRepository;
        this.administrateurRepository = administrateurRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return recruteurRepository.findByEmail(email)
                .map(r -> new User(r.getEmail(), r.getMotDePasse(),
                        r.getEstActif(), true, true, true,
                        List.of(new SimpleGrantedAuthority("ROLE_RECRUTEUR"))))
                .orElseGet(() ->
                        administrateurRepository.findByEmail(email)
                                .map(a -> new User(a.getEmail(), a.getMotDePasse(),
                                        a.getEstActif(), true, true, true,
                                        List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))))
                                .orElseThrow(() -> new UsernameNotFoundException("Utilisateur non trouvé : " + email))
                );
    }
}