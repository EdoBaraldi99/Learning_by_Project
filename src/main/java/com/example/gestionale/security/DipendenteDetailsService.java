package com.example.gestionale.security;

import com.example.gestionale.repositories.DipendenteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class DipendenteDetailsService implements UserDetailsService {
    @Autowired
    private DipendenteRepository dipendenteRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return dipendenteRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Nessun utente con email: " + email + " trovato"));
    }
}
