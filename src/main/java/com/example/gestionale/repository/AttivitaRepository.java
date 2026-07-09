package com.example.gestionale.repository;

import com.example.gestionale.models.Attivita;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AttivitaRepository extends JpaRepository<Attivita, Long>{
    Attivita findAttivitaByTitoloContains(String titolo);
}
