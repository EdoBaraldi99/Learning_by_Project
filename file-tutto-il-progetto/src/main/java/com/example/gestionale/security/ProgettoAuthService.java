package com.example.gestionale.security;

import com.example.gestionale.models.Dipendente;
import com.example.gestionale.models.RuoliProgetto;
import com.example.gestionale.repositories.AssegnatoRepository;
import com.example.gestionale.repositories.AssociatoRepository;
import com.example.gestionale.repositories.AttivitaRepository;
import com.example.gestionale.repositories.StoricoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service("progettoAuthService")
public class ProgettoAuthService {
    @Autowired
    private AssociatoRepository associatoRepository;
    @Autowired
    private AttivitaRepository attivitaRepository;
    @Autowired
    private AssegnatoRepository assegnatoRepository;
    @Autowired
    private StoricoRepository storicoRepository;

    public ProgettoAuthService(AssociatoRepository associatoRepository, AttivitaRepository attivitaRepository, AssegnatoRepository assegnatoRepository, StoricoRepository storicoRepository) {
        this.associatoRepository = associatoRepository;
        this.attivitaRepository = attivitaRepository;
        this.assegnatoRepository = assegnatoRepository;
        this.storicoRepository = storicoRepository;
    }

    public boolean isCapoProgetto(Long idProgetto, Authentication authentication) {
        if (idProgetto == null || authentication == null) return false;

        Dipendente d = (Dipendente) authentication.getPrincipal();
        return associatoRepository.existsByDipendenteIdDipendenteAndProgettoIdProgettoAndRuolo(
                d.getIdDipendente(), idProgetto, RuoliProgetto.TEAM_LEADER);
    }

    public boolean isCapoProgettoDiAttivita(Long idTask, Authentication authentication) {
        if (idTask == null || authentication == null) return false;

        return attivitaRepository.findById(idTask)
                .map(a -> a.getProgetto() != null
                        && isCapoProgetto(a.getProgetto().getIdProgetto(), authentication))
                .orElse(false);
    }
    public boolean isCapoProgettoDiAssegnato(Long idAssegnato, Authentication authentication) {
        if (idAssegnato == null || authentication == null) return false;

        return assegnatoRepository.findById(idAssegnato)
                .map(a -> a.getAttivita() != null
                        && isCapoProgettoDiAttivita(a.getAttivita().getIdTask(), authentication))
                .orElse(false);
    }

    public boolean isCapoProgettoDiAssociato(Long idAssociato, Authentication authentication) {
        if (idAssociato == null || authentication == null) return false;

        return associatoRepository.findById(idAssociato)
                .map(a -> a.getProgetto() != null
                        && isCapoProgetto(a.getProgetto().getIdProgetto(), authentication))
                .orElse(false);
    }

    // Un dipendente assegnato a una task deve poterla aggiornare (es. segnarla
    // completata) anche se non è capoprogetto: prima solo admin/capoprogetto
    // potevano chiamare PATCH /attivita/modifica/{id}, causando 403 al semplice
    // assegnatario che provava a completare la propria attività.
    public boolean isAssegnatoAdAttivita(Long idTask, Authentication authentication) {
        if (idTask == null || authentication == null) return false;

        Dipendente d = (Dipendente) authentication.getPrincipal();
        return assegnatoRepository.existsByAttivitaIdTaskAndDipendenteIdDipendente(idTask, d.getIdDipendente());
    }

    // Una voce di storico è modificabile solo da chi l'ha creata (oltre che dall'admin).
    public boolean isProprietarioStorico(Long idStorico, Authentication authentication) {
        if (idStorico == null || authentication == null) return false;

        Dipendente d = (Dipendente) authentication.getPrincipal();
        return storicoRepository.findById(idStorico)
                .map(s -> s.getDipendente() != null && d.getIdDipendente().equals(s.getDipendente().getIdDipendente()))
                .orElse(false);
    }
}
