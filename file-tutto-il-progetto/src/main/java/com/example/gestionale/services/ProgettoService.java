package com.example.gestionale.services;


import com.example.gestionale.dto.ProgettoRequestDTO;
import com.example.gestionale.dto.ProgettoResponseDTO;
import com.example.gestionale.models.Progetto;
import com.example.gestionale.repositories.ProgettoRepository;
import com.example.gestionale.exceptions.EntitaNonTrovata;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;

@Service
public class ProgettoService {
    @Autowired
    public ProgettoRepository progettoRepository;

    public List<ProgettoResponseDTO> listaProgetti() {
        return progettoRepository.findAll().stream()
                .map(ProgettoResponseDTO::fromEntity)
                .toList();
    }
    public ProgettoResponseDTO schedaProgettoPerId(Long id) {
        Progetto p = progettoRepository.findById(id)
                .orElseThrow(() -> new EntitaNonTrovata("Progetto con Id: " + id + " non trovato"));
        return ProgettoResponseDTO.fromEntity(p);
    }
    public ProgettoResponseDTO salvaProgetto(ProgettoRequestDTO progetto) {
        validaIntervalloDate(progetto.getDataInizio(), progetto.getDataFine());
        Progetto progettoSalvato = progettoRepository.save(progetto.toEntity());
        return ProgettoResponseDTO.fromEntity(progettoSalvato);
    }
    public ProgettoResponseDTO modificaProgettoPerId(Long id, ProgettoRequestDTO progetto) {
        Progetto p = progettoRepository.findById(id)
                .orElseThrow(() -> new EntitaNonTrovata("Progetto con Id: " + id + " non trovato"));

        // null = campo non inviato, non toccare (aggiornamento parziale); una
        // stringa vuota/di soli spazi invece va sempre rifiutata esplicitamente.
        if (progetto.getNome() != null) {
            if (progetto.getNome().isBlank()) {
                throw new IllegalArgumentException("Il nome del progetto non può essere vuoto");
            }
            p.setNome(progetto.getNome());
        }
        if (progetto.getDescrizione() != null) {
            p.setDescrizione(progetto.getDescrizione());
        }
        if (progetto.getStato() != null) {
            if (progetto.getStato().isBlank()) {
                throw new IllegalArgumentException("Lo stato del progetto non può essere vuoto");
            }
            p.setStato(progetto.getStato());
        }
        if (progetto.getDataInizio() != null) {
            p.setDataInizio(progetto.getDataInizio());
        }
        if (progetto.getDataFine() != null) {
            p.setDataFine(progetto.getDataFine());
        }
        validaIntervalloDate(p.getDataInizio(), p.getDataFine());

        return ProgettoResponseDTO.fromEntity(progettoRepository.save(p));
    }

    private void validaIntervalloDate(LocalDate dataInizio, LocalDate dataFine) {
        if (dataInizio != null && dataFine != null && dataInizio.isAfter(dataFine)) {
            throw new IllegalArgumentException("La data di inizio non può essere successiva alla data di fine");
        }
    }
    // Solo l'Admin può chiamare questa operazione (vedi SecurityConfig): può eliminare
    // un progetto anche se ha ancora dipendenti associati (capoprogetto incluso) — le
    // associazioni vengono eliminate insieme al progetto (cascade su Progetto.associati).
    // Le attività collegate restano invece bloccanti: vanno rimosse esplicitamente prima.
    public void eliminaProgettoPerId(Long id) {
        Progetto p = progettoRepository.findById(id)
                .orElseThrow(() -> new EntitaNonTrovata("Progetto con Id: " + id + " non trovato"));

        if (p.getAttivita() != null && !p.getAttivita().isEmpty()) {
            throw new IllegalStateException(
                    "Impossibile eliminare il progetto: sono presenti " + p.getAttivita().size() + " attività collegate"
            );
        }

        progettoRepository.delete(p);
    }
}
