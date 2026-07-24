package com.example.gestionale.repositories;

import com.example.gestionale.models.Dipendente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface DipendenteRepository extends JpaRepository<Dipendente, Long>{
    Optional<Dipendente> findByEmail(String email);
    Optional<Dipendente> findByResetToken(String resetToken);
}
