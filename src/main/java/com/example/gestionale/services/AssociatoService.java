package com.example.gestionale.services;

import com.example.gestionale.models.*;
import com.example.gestionale.repository.AssociatoRepository;
import com.example.gestionale.repository.AttivitaRepository;
import com.example.gestionale.repository.DipendenteRepository;
import com.example.gestionale.repository.ProgettoRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class AssociatoService {
    @Autowired
    public AssociatoRepository associatoRepository;
    @Autowired
    public DipendenteRepository dipendenteRepository;
    @Autowired
    public ProgettoRepository progettoRepository;

    public List<Associato> listaAssociati() {
        return associatoRepository.findAll();
    }
    @Transactional
    public Associato associaDipendenteProgetto(Long idDipendente, Long idProgetto, LocalDate dataInizio, LocalDate dataFine, String ruolo){
        Dipendente dipendente = dipendenteRepository.findById(idDipendente).get();
               // .orElseThrow(() -> new RuntimeException("Dipendente con ID: "+ idDipendente +" non trovato sul database"));
        Progetto progetto = progettoRepository.findById(idProgetto).get();
               // .orElseThrow(() -> new RuntimeException("Progetto con ID: "+ idProgetto +" non trovato sul database"));

        Associato nuovaAssociazione = new Associato();

        nuovaAssociazione.setDipendente(dipendente);
        nuovaAssociazione.setProgetto(progetto);
        nuovaAssociazione.setDataInizio(dataInizio);
        nuovaAssociazione.setDataFine(dataFine);
        nuovaAssociazione.setRuolo(ruolo);

        return associatoRepository.save(nuovaAssociazione);
    }
    @Transactional
    public void cancellaAssociazione(Long idDipendente, Long idProgetto){
        Associato associato = associatoRepository.findByIdDipendenteAndIdProgetto(idDipendente, idProgetto).get();
           //     .orElseThrow(() -> new RuntimeException("Associazione non trovata"));

        associatoRepository.delete(associato);
    }
}
