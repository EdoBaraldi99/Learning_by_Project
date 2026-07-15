package com.example.gestionale.services;


import com.example.gestionale.dto.CambioRuoloAdminDTO;
import com.example.gestionale.dto.DipendenteRequestDTO;
import com.example.gestionale.dto.DipendenteResponseDTO;
import com.example.gestionale.dto.RegistrazioneDTO;
import com.example.gestionale.exceptions.EntitaNonTrovata;
import com.example.gestionale.models.Dipendente;
import com.example.gestionale.repositories.DipendenteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class DipendenteService {
    @Autowired
    private  DipendenteRepository dipendenteRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    public DipendenteService(DipendenteRepository dipendenteRepository, PasswordEncoder passwordEncoder) {
        this.dipendenteRepository = dipendenteRepository;
        this.passwordEncoder = passwordEncoder;
    }

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
        dipendente.setPassword(passwordEncoder.encode(dipendente.getPassword())); // hash applicato dal Service
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
    public DipendenteResponseDTO cambiaRuoloAdmin(Long id, CambioRuoloAdminDTO cambioRuolo) {
        if (cambioRuolo.getIsAdmin() == null) {
            throw new IllegalArgumentException("Il campo Admin è obbligatorio");
        }

        Dipendente d = dipendenteRepository.findById(id)
                .orElseThrow(() -> new EntitaNonTrovata("Dipendente non trovato: " + id));

        d.setIsAdmin(cambioRuolo.getIsAdmin());

        return DipendenteResponseDTO.fromEntity(dipendenteRepository.save(d));
    }
    public DipendenteResponseDTO registra(RegistrazioneDTO request) {
        if (dipendenteRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalStateException("Email già registrata");
        }

        Dipendente d = new Dipendente();
        d.setNome(request.getNome());
        d.setCognome(request.getCognome());
        d.setEmail(request.getEmail());
        d.setArea(request.getArea());
        d.setPassword(passwordEncoder.encode(request.getPassword()));
        d.setIsAdmin(false); // forzato, sempre — non modificabile in questo flusso

        return DipendenteResponseDTO.fromEntity(dipendenteRepository.save(d));
    }
}
