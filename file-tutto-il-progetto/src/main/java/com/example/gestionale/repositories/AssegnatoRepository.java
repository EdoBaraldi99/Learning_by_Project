package com.example.gestionale.repositories;

import com.example.gestionale.models.Assegnato;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AssegnatoRepository extends JpaRepository<Assegnato, Long> {
    List<Assegnato> findByDipendenteIdDipendente(Long idDipendente);
    List<Assegnato> findByAttivitaIdTask(Long idTask);
    boolean existsByAttivitaIdTaskAndDipendenteIdDipendente(Long idTask, Long idDipendente);
}
