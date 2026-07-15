package com.example.gestionale.services;

import com.example.gestionale.dto.*;
import com.example.gestionale.models.*;
import com.example.gestionale.repositories.AssociatoRepository;
import com.example.gestionale.repositories.DipendenteRepository;
import com.example.gestionale.repositories.ProgettoRepository;
import com.example.gestionale.exceptions.EntitaNonTrovata;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AssociatoService {
    @Autowired
    public AssociatoRepository associatoRepository;
    @Autowired
    public DipendenteRepository dipendenteRepository;
    @Autowired
    public ProgettoRepository progettoRepository;

    public List<AssociatoResponseDTO> listaAssociati() {
        return associatoRepository.findAll().stream()
                .map(AssociatoResponseDTO::fromEntity)
                .toList();
    }
    public AssociatoResponseDTO schedaAssociatoPerId(Long id){
        Associato associato = associatoRepository.findById(id)
                .orElseThrow(() -> new EntitaNonTrovata("Associazione con Id: " + id + " non trovata"));
        return AssociatoResponseDTO.fromEntity(associato);
    }
    public AssociatoResponseDTO associaDipendenteProgetto(AssociatoRequestDTO associato){
            Dipendente dipendente = dipendenteRepository.findById(associato.getIdDipendente())
                    .orElseThrow(() -> new EntitaNonTrovata("Dipendente con Id: " + associato.getIdDipendente() + " non trovato"));
            Progetto progetto = progettoRepository.findById(associato.getIdProgetto())
                    .orElseThrow(() -> new EntitaNonTrovata("Progetto con Id: " + associato.getIdProgetto() + " non trovato"));

            Associato associatoSalvato = associato.toEntity();
            associatoSalvato.setDipendente(dipendente);
            associatoSalvato.setProgetto(progetto);

            return AssociatoResponseDTO.fromEntity(associatoRepository.save(associatoSalvato));
    }
    public AssociatoResponseDTO modificaAssociazione(Long id, AssociatoRequestDTO associato) {
        Associato a = associatoRepository.findById(id)
                .orElseThrow(() -> new EntitaNonTrovata("Associazionene con Id: " + id + " non trovata"));

        if (associato.getDataInizio() != null) a.setDataInizio(associato.getDataInizio());
        if (associato.getDataFine() != null) a.setDataFine(associato.getDataFine());
        if (associato.getRuolo() != null) a.setRuolo(associato.getRuolo());

        if (associato.getIdDipendente() != null) {
            Dipendente dipendente = dipendenteRepository.findById(associato.getIdDipendente())
                    .orElseThrow(() -> new EntitaNonTrovata("Dipendente con Id: " + associato.getIdDipendente() + " non trovato"));
            a.setDipendente(dipendente);
        }
        if (associato.getIdProgetto() != null) {
            Progetto progetto = progettoRepository.findById(associato.getIdProgetto())
                    .orElseThrow(() -> new EntitaNonTrovata("Progetto con Id: " + associato.getIdProgetto() + " non trovato"));
            a.setProgetto(progetto);
        }

        return AssociatoResponseDTO.fromEntity(associatoRepository.save(a));
    }
    public void eliminaAssociazione(Long id) {
        if (!associatoRepository.existsById(id)) {
            throw new EntitaNonTrovata("Assegnazione con Id: " + id + " non trovata");
        }
        associatoRepository.deleteById(id);
    }
    public List<AssociatoResponseDTO> trovaPerDipendente(Long id) {
        if (!dipendenteRepository.existsById(id)) {
            throw new  EntitaNonTrovata("Dipendente con Id: " + id + " non trovato");
        }
        return associatoRepository.findByDipendenteIdDipendente(id).stream()
                .map(AssociatoResponseDTO::fromEntity)
                .toList();
    }
    public List<AssociatoResponseDTO> trovaPerProgetto(Long id) {
        if (!progettoRepository.existsById(id)) {
            throw new EntitaNonTrovata("Progetto con Id: " + id + " non trovato");
        }
        return associatoRepository.findByProgettoIdProgetto(id).stream()
                .map(AssociatoResponseDTO::fromEntity)
                .toList();
    }
}
