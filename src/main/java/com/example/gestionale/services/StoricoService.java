package com.example.gestionale.services;


import com.example.gestionale.dto.StoricoRequestDTO;
import com.example.gestionale.dto.StoricoResponseDTO;
import com.example.gestionale.models.Attivita;
import com.example.gestionale.exceptions.EntitaNonTrovata;
import com.example.gestionale.models.Dipendente;
import com.example.gestionale.models.Storico;
import com.example.gestionale.repositories.AttivitaRepository;
import com.example.gestionale.repositories.StoricoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class StoricoService {
    @Autowired
    public StoricoRepository storicoRepository;
    @Autowired
    public AttivitaRepository attivitaRepository;

    public List<StoricoResponseDTO> listaStorici() {
        return storicoRepository.findAll().stream()
                .map(StoricoResponseDTO::fromEntity)
                .toList();
    }
    public StoricoResponseDTO schedaStoricoPerId(Long id) {
        Storico storico = storicoRepository.findById(id)
                .orElseThrow(() -> new EntitaNonTrovata("Storico con Id: " + id + " non trovato"));
        return StoricoResponseDTO.fromEntity(storico);
    }
    public StoricoResponseDTO salvaStorico(StoricoRequestDTO storico, Authentication authentication) {
        Storico storicoSalvato = storico.toEntity();

        if (authentication != null && authentication.getPrincipal() instanceof Dipendente d) {
            storicoSalvato.setDipendente(d);
        }

        if (storico.getIdTask() != null) {
            Attivita attivita = attivitaRepository.findById(storico.getIdTask())
                    .orElseThrow(() -> new EntitaNonTrovata("Attività con Id: " + storico.getIdTask() + " non trovato"));
            storicoSalvato.setAttivita(attivita);
        }

        return StoricoResponseDTO.fromEntity(storicoRepository.save(storicoSalvato));
    }
    public StoricoResponseDTO modificaStorico(Long id, StoricoRequestDTO storico) {
        Storico s = storicoRepository.findById(id)
                .orElseThrow(() -> new EntitaNonTrovata("Storico con Id: " + id + " non trovato"));

        if (storico.getData() != null) s.setData(storico.getData());
        if (storico.getDescrizione() != null) s.setDescrizione(storico.getDescrizione());
        if (storico.getTempoLavorato() != null) s.setTempoLavorato(storico.getTempoLavorato());

        if (storico.getIdTask() != null) {
            Attivita attivita = attivitaRepository.findById(storico.getIdTask())
                    .orElseThrow(() -> new EntitaNonTrovata("Attività con Id: " + storico.getIdTask() + " non trovato"));
            s.setAttivita(attivita);
        }

        return StoricoResponseDTO.fromEntity(storicoRepository.save(s));
    }
}
