package com.example.gestionale.services;

import com.example.gestionale.models.Storico;
import com.example.gestionale.repository.StoricoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class StoricoService {
    @Autowired
    public StoricoRepository storicoRepository;

    public List<Storico> listaStorici() {
        return storicoRepository.findAll();
    }
    public Storico salvaStorico(Storico storico) {
        return storicoRepository.save(storico);
    }
    public Storico ottieniStoricoPerId(Long id) {
        return storicoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Storico con ID: " + id + " non trovato nel database"));
    }

}
