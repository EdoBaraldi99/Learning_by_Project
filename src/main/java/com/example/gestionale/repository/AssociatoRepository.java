package com.example.gestionale.repository;

import com.example.gestionale.models.Assegnato;
import com.example.gestionale.models.Associato;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface AssociatoRepository extends JpaRepository<Associato, Long> {
    @Query("SELECT a FROM Associato a WHERE a.dipendente.idDipendente = :idDipendente AND a.progetto.idProgetto = :idProgetto")
    Optional<Associato> findByIdDipendenteAndIdProgetto(@Param("idDipendente") Long idDipendente,
                                                        @Param("idProgetto") Long idProgetto);
}
