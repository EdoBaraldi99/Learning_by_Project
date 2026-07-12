package com.example.gestionale.repository;

import com.example.gestionale.models.Associato;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AssociatoRepository extends JpaRepository<Associato, Long> {
    List<Associato> findByDipendenteIdDipendente(Long idDipendente);

    List<Associato> findByProgettoIdProgetto(Long idProgetto);
}
