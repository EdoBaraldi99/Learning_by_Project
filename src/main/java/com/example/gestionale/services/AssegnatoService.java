package com.example.gestionale.services;

import com.example.gestionale.models.Assegnato;
import com.example.gestionale.models.Attivita;
import com.example.gestionale.models.Dipendente;
import com.example.gestionale.repository.AssegnatoRepository;
import com.example.gestionale.repository.AttivitaRepository;
import com.example.gestionale.repository.DipendenteRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class AssegnatoService {
    @Autowired
    public AssegnatoRepository assegnatoRepository;
    @Autowired
    public DipendenteRepository dipendenteRepository;
    @Autowired
    public AttivitaRepository attivitaRepository;

    public List<Assegnato> listaAssegnati() {
        return assegnatoRepository.findAll();
    }
    @Transactional
    public Assegnato assegnaDipendenteAttivita(Long idDipendente, Long idTask, LocalDate dataInizio, LocalDate dataFine, String ruolo){
        Dipendente dipendente = dipendenteRepository.findById(idDipendente).get();
          //      .orElseThrow(() -> new RuntimeException("Dipendente con ID: "+ idDipendente +" non trovato sul database"));
        Attivita attivita = attivitaRepository.findById(idTask).get();
            //    .orElseThrow(() -> new RuntimeException("Attivita con ID: "+ idTask +" non trovato sul database"));

        Assegnato nuovaAssegnazione = new Assegnato();

        nuovaAssegnazione.setDipendente(dipendente);
        nuovaAssegnazione.setAttivita(attivita);
        nuovaAssegnazione.setDataInizio(dataInizio);
        nuovaAssegnazione.setDataFine(dataFine);
        nuovaAssegnazione.setRuolo(ruolo);

        return assegnatoRepository.save(nuovaAssegnazione);
    }
    @Transactional
    public void cancellaAssegnazione(Long idDipendente, Long idTask){
        Assegnato assegnato = assegnatoRepository.findByIdDipendenteAndIdTask(idDipendente, idTask).get();
              //  .orElseThrow(() -> new RuntimeException("Assegnazione non trovata"));

        assegnatoRepository.delete(assegnato);
    }
}
