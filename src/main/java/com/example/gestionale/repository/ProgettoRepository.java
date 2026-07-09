package com.example.gestionale.repository;

import com.example.gestionale.models.Progetto;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProgettoRepository extends JpaRepository<Progetto, Long> {
}
