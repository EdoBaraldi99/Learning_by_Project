package com.example.gestionale.services;


import com.example.gestionale.dto.DipendenteRequestDTO;
import com.example.gestionale.dto.DipendenteResponseDTO;
import com.example.gestionale.exceptions.EntitaNonTrovata;
import com.example.gestionale.models.Dipendente;
import com.example.gestionale.repository.DipendenteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class DipendenteService {
    @Autowired
    public DipendenteRepository dipendenteRepository;

    public List<DipendenteResponseDTO> listaDipendenti() {
        return dipendenteRepository.findAll().stream()
                .map(DipendenteResponseDTO::fromEntity)
                .toList();
    }
    public DipendenteResponseDTO schedaDipendentePerId(Long id) {
        Dipendente dipendente = dipendenteRepository.findById(id)
                .orElseThrow(() -> new EntitaNonTrovata("Dipendente con Id: " + id + " non trovato"));
        return DipendenteResponseDTO.fromEntity(dipendente);
    }
    public DipendenteResponseDTO salvaDipendente(DipendenteRequestDTO dipendente) {
        Dipendente dipendenteSalvato = dipendente.toEntity();
        //dipendente.setPassword(passwordEncoder.encode(dipendente.getPassword())); // hash applicato dal Service
        return DipendenteResponseDTO.fromEntity(dipendenteRepository.save(dipendenteSalvato));
    }
    public DipendenteResponseDTO modificaDipendentePerId(Long id,  DipendenteRequestDTO dipendente) {
        Dipendente d = dipendenteRepository.findById(id)
                .orElseThrow(() -> new EntitaNonTrovata("Dipendente con Id: " + id + " non trovato"));

        if (dipendente.getNome() != null) d.setNome(dipendente.getNome());
        if (dipendente.getCognome() != null) d.setCognome(dipendente.getCognome());
        if (dipendente.getEmail() != null) d.setEmail(dipendente.getEmail());
        if (dipendente.getArea() != null) d.setArea(dipendente.getArea());

        return DipendenteResponseDTO.fromEntity(dipendenteRepository.save(d));
    }
    public void eliminaDipendentePerId(Long id) {
        Dipendente d = dipendenteRepository.findById(id)
                .orElseThrow(() -> new EntitaNonTrovata("Dipendente con Id: " + id + " non trovato"));

        if (d.getAssegnati() != null && !d.getAssegnati().isEmpty()) {
            throw new IllegalStateException(
                    "Impossibile eliminare il dipendente: ha ancora " + d.getAssegnati().size() + " task assegnati"
            );
        }
        if (d.getAssociati() != null && !d.getAssociati().isEmpty()) {
            throw new IllegalStateException(
                    "Impossibile eliminare il dipendente: è ancora associato a " + d.getAssociati().size() + " progetti"
            );
        }

        dipendenteRepository.deleteById(id);
    }
}
