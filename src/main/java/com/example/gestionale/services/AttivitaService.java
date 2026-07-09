package com.example.gestionale.services;

import com.example.gestionale.models.Attivita;
import com.example.gestionale.repository.AttivitaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class AttivitaService {
    @Autowired
    public AttivitaRepository attivitaRepository;

    public List<Attivita> listaAttivita() {
        return attivitaRepository.findAll();
    }
    public Attivita salvaAttivita(Attivita attivita) {
        return attivitaRepository.save(attivita);
    }
    public Attivita ottieniAttivitaPerId(Long id) {
        return attivitaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Attività con ID: " + id + " non trovato nel database"));
    }
    public Attivita ottieniAttivitaPerTitolo(String titolo) {
        return attivitaRepository.findAttivitaByTitoloContains(titolo);
    }
    public Attivita modificaAttivitaPerId(Long id, Attivita attivita){
        if(!attivitaRepository.existsById(id)){
            return null;
        }

        Attivita nuovaAttivita = attivitaRepository.findById(id).get();

        if(attivita.stato.isEmpty()){
            nuovaAttivita.setStato(nuovaAttivita.getStato());
        }
        else{
            nuovaAttivita.setStato(attivita.getStato());
        }
        if(attivita.assegnati.isEmpty()){
            nuovaAttivita.setAssegnati(nuovaAttivita.getAssegnati());
        }
        else{
            nuovaAttivita.setAssegnati(attivita.getAssegnati());
        }
        if(attivita.descrizione.isEmpty()){
            nuovaAttivita.setDescrizione(nuovaAttivita.getDescrizione());
        }
        else{
            nuovaAttivita.setDescrizione(attivita.getDescrizione());
        }
        if(attivita.priorita.isEmpty()){
            nuovaAttivita.setPriorita(nuovaAttivita.getPriorita());
        }
        else{
            nuovaAttivita.setPriorita(attivita.getPriorita());
        }
        if(attivita.tempoStimato.isEmpty()){
            nuovaAttivita.setTempoStimato(nuovaAttivita.getTempoStimato());
        }
        else{
            nuovaAttivita.setTempoStimato(attivita.getTempoStimato());
        }
        if(attivita.tipologia.isEmpty()){
            nuovaAttivita.setTipologia(nuovaAttivita.getTipologia());
        }
        else{
            nuovaAttivita.setTipologia(attivita.getTipologia());
        }
        nuovaAttivita.setDataScadenza(attivita.getDataScadenza());

        attivitaRepository.save(nuovaAttivita);

        return nuovaAttivita;
    }
    public void eliminaAttivitaPerId(Long id) {
        if (!attivitaRepository.existsById(id)) {
            throw new RuntimeException("Attività con ID: " + id + " non trovata nel database. Impossibile eliminare.");
        }
        attivitaRepository.deleteById(id);
    }

}
