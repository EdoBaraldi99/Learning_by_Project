package com.example.gestionale.security;

import com.example.gestionale.models.Dipendente;
import com.example.gestionale.models.RuoliProgetto;
import com.example.gestionale.repositories.AssegnatoRepository;
import com.example.gestionale.repositories.AssociatoRepository;
import com.example.gestionale.repositories.AttivitaRepository;
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

    public ProgettoAuthService(AssociatoRepository associatoRepository,AttivitaRepository attivitaRepository, AssegnatoRepository assegnatoRepository) {
        this.associatoRepository = associatoRepository;
        this.attivitaRepository = attivitaRepository;
        this.assegnatoRepository = assegnatoRepository;
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
}
