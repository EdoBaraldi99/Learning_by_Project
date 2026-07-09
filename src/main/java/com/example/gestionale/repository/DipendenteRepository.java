package com.example.gestionale.repository;

import com.example.gestionale.models.Dipendente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DipendenteRepository extends JpaRepository<Dipendente, Long>{
    @Query("SELECT d FROM Dipendente d WHERE d.email = :email")
    Dipendente findDipendenteByEmail(@Param("email")String email);
}
