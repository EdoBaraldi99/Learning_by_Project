package com.example.gestionale.services;

import com.example.gestionale.dto.AssegnatoRequestDTO;
import com.example.gestionale.dto.AssegnatoResponseDTO;
import com.example.gestionale.exceptions.EntitaNonTrovata;
import com.example.gestionale.models.Assegnato;
import com.example.gestionale.models.Attivita;
import com.example.gestionale.models.Dipendente;
import com.example.gestionale.repositories.AssegnatoRepository;
import com.example.gestionale.repositories.AttivitaRepository;
import com.example.gestionale.repositories.DipendenteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class AssegnatoService {
    @Autowired
    public AssegnatoRepository assegnatoRepository;
    @Autowired
    public DipendenteRepository dipendenteRepository;
    @Autowired
    public AttivitaRepository attivitaRepository;

    public List<AssegnatoResponseDTO> listaAssegnati() {
        return assegnatoRepository.findAll().stream()
                .map(AssegnatoResponseDTO::fromEntity)
                .toList();
    }
    public AssegnatoResponseDTO schedaAssegnatoPerId(Long id){
        Assegnato assegnato = assegnatoRepository.findById(id)
                .orElseThrow(() -> new EntitaNonTrovata("Assegnazione con Id: " + id + " non trovata"));
        return AssegnatoResponseDTO.fromEntity(assegnato);
    }
    public AssegnatoResponseDTO assegnaDipendenteAttivita(AssegnatoRequestDTO assegnato){
        Dipendente dipendente = dipendenteRepository.findById(assegnato.getIdDipendente())
                .orElseThrow(() -> new EntitaNonTrovata("Dipendente con Id: " + assegnato.getIdDipendente() + " non trovato"));
        Attivita attivita = attivitaRepository.findById(assegnato.getIdAttivita())
                .orElseThrow(() -> new EntitaNonTrovata("Attività con Id: " + assegnato.getIdAttivita() + " non trovata"));

        Assegnato assegnatoSalvato = assegnato.toEntity();
        assegnatoSalvato.setDipendente(dipendente);
        assegnatoSalvato.setAttivita(attivita);

        return AssegnatoResponseDTO.fromEntity(assegnatoRepository.save(assegnatoSalvato));
    }
    public AssegnatoResponseDTO modificaAssegnazione(Long id, AssegnatoRequestDTO assegnato) {
        Assegnato a = assegnatoRepository.findById(id)
                .orElseThrow(() -> new EntitaNonTrovata("Assegnazione con Id: " + id + " non trovata"));

        if (assegnato.getDataInizio() != null) a.setDataInizioAttivita(assegnato.getDataInizio());
        if (assegnato.getDataFine() != null) a.setDataFineAttivita(assegnato.getDataFine());
        if (assegnato.getRuolo() != null) a.setRuolo(assegnato.getRuolo());

        if (assegnato.getIdDipendente() != null) {
            Dipendente dipendente = dipendenteRepository.findById(assegnato.getIdDipendente())
                    .orElseThrow(() -> new EntitaNonTrovata("Dipendente con Id: " + assegnato.getIdDipendente() + " non trovato"));
            a.setDipendente(dipendente);
        }
        if (assegnato.getIdAttivita() != null) {
            Attivita attivita = attivitaRepository.findById(assegnato.getIdAttivita())
                    .orElseThrow(() -> new EntitaNonTrovata("Attività con Id: " + assegnato.getIdAttivita() + " non trovata"));
            a.setAttivita(attivita);
        }

        return AssegnatoResponseDTO.fromEntity(assegnatoRepository.save(a));
    }
    public void eliminaAssegnazione(Long id) {
        if (!assegnatoRepository.existsById(id)) {
            throw new EntitaNonTrovata("Assegnazione con Id: " + id + " non trovata");
        }
        assegnatoRepository.deleteById(id);
    }
    public List<AssegnatoResponseDTO> trovaPerDipendente(Long id) {
        if (!dipendenteRepository.existsById(id)) {
            throw new  EntitaNonTrovata("Dipendente con Id: " + id + " non trovato");
        }
        return assegnatoRepository.findByDipendenteIdDipendente(id).stream()
                .map(AssegnatoResponseDTO::fromEntity)
                .toList();
    }
    public List<AssegnatoResponseDTO> trovaPerAttivita(Long id) {
        if (!attivitaRepository.existsById(id)) {
            throw new EntitaNonTrovata("Attivita con Id: " + id + " non trovato");
        }
        return assegnatoRepository.findByAttivitaIdTask(id).stream()
                .map(AssegnatoResponseDTO::fromEntity)
                .toList();
    }
}
