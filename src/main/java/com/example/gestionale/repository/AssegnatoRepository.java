package com.example.gestionale.repository;

import com.example.gestionale.models.Assegnato;
import com.example.gestionale.models.Associato;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AssegnatoRepository extends JpaRepository<Assegnato, Long> {
    List<Assegnato> findByDipendenteIdDipendente(Long idDipendente);
    List<Assegnato> findByAttivitaIdTask(Long idTask);
}
