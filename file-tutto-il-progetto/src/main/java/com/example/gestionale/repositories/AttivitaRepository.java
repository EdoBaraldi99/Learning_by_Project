package com.example.gestionale.repositories;

import com.example.gestionale.models.Attivita;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AttivitaRepository extends JpaRepository<Attivita, Long>{
    Attivita findAttivitaByTitoloContains(String titolo);
}
