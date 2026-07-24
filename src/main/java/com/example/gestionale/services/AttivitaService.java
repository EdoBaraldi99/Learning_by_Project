package com.example.gestionale.services;

import com.example.gestionale.dto.AttivitaRequestDTO;
import com.example.gestionale.dto.AttivitaResponseDTO;
import com.example.gestionale.exceptions.EntitaNonTrovata;
import com.example.gestionale.models.Attivita;
import com.example.gestionale.models.Progetto;
import com.example.gestionale.repositories.AttivitaRepository;
import com.example.gestionale.repositories.ProgettoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class AttivitaService {
    @Autowired
    public AttivitaRepository attivitaRepository;
    @Autowired
    public ProgettoRepository progettoRepository;

    public List<AttivitaResponseDTO> listaAttivita() {
        return attivitaRepository.findAll().stream()
                .map(AttivitaResponseDTO::fromEntity)
                .toList();
    }
    public AttivitaResponseDTO schedaAttivitaPerId(Long id) {
        Attivita attivita = attivitaRepository.findById(id)
                .orElseThrow(() -> new EntitaNonTrovata("Attivita con Id: " + id + " non trovata"));
        return AttivitaResponseDTO.fromEntity(attivita);
    }
    public Attivita ottieniAttivitaPerTitolo(String titolo) {
        return attivitaRepository.findAttivitaByTitoloContains(titolo);
    }
    public AttivitaResponseDTO salvaAttivita(AttivitaRequestDTO attivita) {
        richiediTempoNonNegativo(attivita.getTempoStimato());
        Attivita attivitaSalvata = attivita.toEntity();

        if (attivita.getIdProgetto() != null) {
            Progetto progetto = progettoRepository.findById(attivita.getIdProgetto())
                    .orElseThrow(() -> new EntitaNonTrovata("Progetto con Id: " + attivita.getIdProgetto() + " non trovato"));
            attivitaSalvata.setProgetto(progetto);
        }

        return AttivitaResponseDTO.fromEntity(attivitaRepository.save(attivitaSalvata));
    }
    private static void richiediNonVuoto(String valore, String messaggioErrore) {
        if (valore.isBlank()) {
            throw new IllegalArgumentException(messaggioErrore);
        }
    }

    // tempoStimato è una stringa formattata lato client (es. "2h 30m", "3 ore"), non un
    // numero: un valore negativo vi compare sempre come un "-" (es. "-3h -10m"), che
    // parseMinutes() lato client non sa nemmeno interpretare correttamente.
    private static void richiediTempoNonNegativo(String tempoStimato) {
        if (tempoStimato != null && tempoStimato.contains("-")) {
            throw new IllegalArgumentException("Il tempo stimato non può essere negativo");
        }
    }

    public AttivitaResponseDTO modificaAttivitaPerId(Long id, AttivitaRequestDTO attivita) {
        Attivita a = attivitaRepository.findById(id)
                .orElseThrow(() -> new EntitaNonTrovata("Attività con Id: " + id + " non trovata"));

        // null = campo non inviato, non toccare (aggiornamento parziale); una
        // stringa vuota/di soli spazi invece va sempre rifiutata esplicitamente.
        if (attivita.getTitolo() != null) {
            richiediNonVuoto(attivita.getTitolo(), "Il titolo non può essere vuoto");
            a.setTitolo(attivita.getTitolo());
        }
        if (attivita.getDescrizione() != null) a.setDescrizione(attivita.getDescrizione());
        if (attivita.getDataAssegnazione() != null) a.setDataAssegnazione(attivita.getDataAssegnazione());
        if (attivita.getScadenza() != null) a.setDataScadenza(attivita.getScadenza());
        if (attivita.getTempoStimato() != null) {
            richiediNonVuoto(attivita.getTempoStimato(), "Il tempo stimato non può essere vuoto");
            richiediTempoNonNegativo(attivita.getTempoStimato());
            a.setTempoStimato(attivita.getTempoStimato());
        }
        if (attivita.getStato() != null) {
            richiediNonVuoto(attivita.getStato(), "Lo stato non può essere vuoto");
            a.setStato(attivita.getStato());
        }
        if (attivita.getTipologia() != null) {
            richiediNonVuoto(attivita.getTipologia(), "La tipologia non può essere vuota");
            a.setTipologia(attivita.getTipologia());
        }
        if (attivita.getPriorita() != null) {
            richiediNonVuoto(attivita.getPriorita(), "La priorità non può essere vuota");
            a.setPriorita(attivita.getPriorita());
        }

        if (attivita.getIdProgetto() != null) {
            Progetto progetto = progettoRepository.findById(attivita.getIdProgetto())
                    .orElseThrow(() -> new EntitaNonTrovata("Progetto con Id: " + attivita.getIdProgetto() + " non trovato"));
            a.setProgetto(progetto);
        }

        return AttivitaResponseDTO.fromEntity(attivitaRepository.save(a));
    }
    public void eliminaAttivitaPerId(Long id) {
        Attivita a = attivitaRepository.findById(id)
                .orElseThrow(() -> new EntitaNonTrovata("Attività con Id: " + id + " non trovata"));

        if (a.getAssegnati() != null && !a.getAssegnati().isEmpty()) {
            throw new IllegalStateException(
                    "Impossibile eliminare l'attività: sono presenti " + a.getAssegnati().size() + " assegnazioni collegate"
            );
        }

        attivitaRepository.deleteById(id);
    }

}
