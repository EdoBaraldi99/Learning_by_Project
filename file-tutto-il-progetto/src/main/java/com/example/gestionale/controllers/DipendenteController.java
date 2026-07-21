package com.example.gestionale.controllers;

import com.example.gestionale.dto.CambioRuoloAdminDTO;
import com.example.gestionale.dto.DipendenteRequestDTO;
import com.example.gestionale.dto.DipendenteResponseDTO;
import com.example.gestionale.services.DipendenteService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/dipendenti")
public class DipendenteController {

    @Autowired
    public DipendenteService dipendenteService;

    @GetMapping("/lista")
    public ResponseEntity<List<DipendenteResponseDTO>> listaTuttiDipendenti() {
        return ResponseEntity.ok(dipendenteService.listaDipendenti());
    }
    @PostMapping("/crea")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DipendenteResponseDTO> creaDipendente(@Valid @RequestBody DipendenteRequestDTO dipendente){
        return ResponseEntity.status(201).body(dipendenteService.salvaDipendente(dipendente));
    }
    @GetMapping("/{id}")
    public ResponseEntity<DipendenteResponseDTO> schedaDipendentePerId(@PathVariable("id") Long id) {
        return ResponseEntity.ok(dipendenteService.schedaDipendentePerId(id));
    }
    @PatchMapping("/modifica/{id}")
    @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.idDipendente")
    public ResponseEntity<DipendenteResponseDTO> modificaDipendentePerId(@PathVariable("id") Long id, @RequestBody DipendenteRequestDTO dipendente){
        return ResponseEntity.ok(dipendenteService.modificaDipendentePerId(id, dipendente));
    }
    // Il ruolo ADMIN è già richiesto a livello di URL (SecurityConfig): qui si
    // aggiunge solo il vincolo "non se stesso", perché il frontend si limita a
    // nascondere il proprio profilo dall'elenco (utenti.js) — senza questo
    // controllo lato server, l'admin poteva comunque auto-eliminarsi con una
    // chiamata diretta all'API.
    @DeleteMapping("/elimina/{id}")
    @PreAuthorize("#id != authentication.principal.idDipendente")
    public ResponseEntity<String> eliminaDipendentePerId(@PathVariable("id") Long id){
        dipendenteService.eliminaDipendentePerId(id);
        return ResponseEntity.noContent().build();
    }
    @PatchMapping("/{id}/ruolo-admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DipendenteResponseDTO> cambiaRuoloAdmin(@PathVariable Long id, @RequestBody CambioRuoloAdminDTO cambioRuolo) {
        return ResponseEntity.ok(dipendenteService.cambiaRuoloAdmin(id, cambioRuolo));
    }
}
