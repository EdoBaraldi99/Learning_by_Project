package com.example.gestionale.services;


import com.example.gestionale.models.Progetto;
import com.example.gestionale.repository.ProgettoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ProgettoService {
    @Autowired
    public ProgettoRepository progettoRepository;

    public List<Progetto> listaProgetti() {
        return progettoRepository.findAll();
    }
    public Progetto salvaProgetto(Progetto progetto) {
        return progettoRepository.save(progetto);
    }
    public Progetto ottieniProgettoPerId(Long id) {
        return progettoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Progetto con ID: " + id + " non trovato nel database"));
    }
    public Progetto modificaProgettoPerId(Long id, Progetto progetto) {
        if (!progettoRepository.existsById(id)) {
            return null;
        }

        Progetto nuovoProgetto = progettoRepository.findById(id).get();

        if (progetto.stato.isEmpty()) {
            nuovoProgetto.setStato(nuovoProgetto.getStato());
        } else {
            nuovoProgetto.setStato(progetto.getStato());
        }
        if (progetto.nome.isEmpty()) {
            nuovoProgetto.setNome(nuovoProgetto.getNome());
        } else {
            nuovoProgetto.setNome(progetto.getNome());
        }
        if (progetto.descrizione.isEmpty()) {
            nuovoProgetto.setDescrizione(nuovoProgetto.getDescrizione());
        } else {
            nuovoProgetto.setDescrizione(progetto.getDescrizione());
        }
        progettoRepository.save(nuovoProgetto);

        return nuovoProgetto;
    }
    public void eliminaProgettoPerId(Long id){
        if (!progettoRepository.existsById(id)) {
            throw new RuntimeException("Progetto con ID: " + id + " non trovata nel database. Impossibile eliminare.");
        }
        progettoRepository.deleteById(id);
    }}
