package com.example.gestionale.services;


import com.example.gestionale.models.Dipendente;
import com.example.gestionale.repository.DipendenteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class DipendenteService {
    @Autowired
    public DipendenteRepository dipendenteRepository;

    public List<Dipendente> listaDipendenti() {
        return dipendenteRepository.findAll();
    }
    public Dipendente salvaDipendente(Dipendente dipendente) {
        return dipendenteRepository.save(dipendente);
    }
    public Dipendente ottieniDipendentePerId(Long id) {
        return dipendenteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utente con ID: " + id + " non trovato nel database"));
    }
    public Dipendente modificaDipendentePerId(Long id, Dipendente dipendente) {
        if (!dipendenteRepository.existsById(id)) {
            return null;
        }

        Dipendente nuovoDipendente = dipendenteRepository.findById(id).get();

        if (dipendente.nome.isEmpty()) {
            nuovoDipendente.setNome(nuovoDipendente.getNome());
        } else {
            nuovoDipendente.setNome(dipendente.getNome());
        }
        if (dipendente.cognome.isEmpty()) {
            nuovoDipendente.setCognome(nuovoDipendente.getCognome());
        } else {
            nuovoDipendente.setCognome(dipendente.getCognome());
        }
        if (dipendente.email.isEmpty()) {
            nuovoDipendente.setEmail(nuovoDipendente.getEmail());
        } else {
            nuovoDipendente.setEmail(dipendente.getEmail());
        }
        if (dipendente.area.isEmpty()) {
            nuovoDipendente.setArea(nuovoDipendente.getArea());
        } else {
            nuovoDipendente.setArea(dipendente.getArea());
        }
        if (dipendente.associati.isEmpty()) {
            nuovoDipendente.setAssociati(nuovoDipendente.getAssociati());
        } else {
            nuovoDipendente.setAssociati(dipendente.getAssociati());
        }
        if (dipendente.assegnati.isEmpty()) {
            nuovoDipendente.setAssegnati(nuovoDipendente.getAssegnati());
        } else {
            nuovoDipendente.setAssegnati(dipendente.getAssegnati());
        }
        dipendenteRepository.save(nuovoDipendente);

        return nuovoDipendente;
    }
    public void eliminaDipendentePerId(Long id) {
        if (!dipendenteRepository.existsById(id)) {
            throw new RuntimeException("Dipendente con ID: " + id + " non trovata nel database. Impossibile eliminare.");
        }
        dipendenteRepository.deleteById(id);
    }
}
