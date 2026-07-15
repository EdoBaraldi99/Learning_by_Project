package com.example.gestionale.repositories;

import com.example.gestionale.models.Progetto;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProgettoRepository extends JpaRepository<Progetto, Long> {
}
