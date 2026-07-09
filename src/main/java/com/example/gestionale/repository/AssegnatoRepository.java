package com.example.gestionale.repository;

import com.example.gestionale.models.Assegnato;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface AssegnatoRepository extends JpaRepository<Assegnato, Long> {
    @Query("SELECT a FROM Assegnato a WHERE a.dipendente.idDipendente = :idDipendente AND a.attivita.idTask = :idTask")
    Optional<Assegnato> findByIdDipendenteAndIdTask(@Param("idDipendente")Long idDipendente,
                                                        @Param("idTask")Long idTask);
}
