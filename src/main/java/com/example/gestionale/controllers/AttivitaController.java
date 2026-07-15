package com.example.gestionale.controllers;

import com.example.gestionale.dto.AttivitaRequestDTO;
import com.example.gestionale.dto.AttivitaResponseDTO;
import com.example.gestionale.services.AttivitaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/attivita")
public class AttivitaController {

    @Autowired
    public AttivitaService attivitaService;

    @GetMapping("/lista")
    public ResponseEntity<List<AttivitaResponseDTO>> listaTuttiAttivita() {
        return ResponseEntity.ok(attivitaService.listaAttivita());
    }
    @PostMapping("/crea")
    @PreAuthorize("hasRole('ADMIN') or @progettoAuthService.isCapoProgetto(#request.idProgetto, authentication)")
    public ResponseEntity<AttivitaResponseDTO> creaAttivita(@RequestBody AttivitaRequestDTO attivita){
        return ResponseEntity.status(201).body(attivitaService.salvaAttivita(attivita));
    }
    @GetMapping("/{id}")
    public ResponseEntity<AttivitaResponseDTO> schedaAttivitaPerId(@PathVariable("id") Long id) {
        return ResponseEntity.ok(attivitaService.schedaAttivitaPerId(id));
    }
    @PatchMapping("/modifica/{id}")
    @PreAuthorize("hasRole('ADMIN') or @progettoAuthService.isCapoProgetto(#request.idProgetto, authentication)")
    public ResponseEntity<AttivitaResponseDTO> modificaAttivitaPerId(@PathVariable("id") Long id, @RequestBody AttivitaRequestDTO attivita){
        return ResponseEntity.ok(attivitaService.modificaAttivitaPerId(id, attivita));
    }
    @DeleteMapping("/elimina/{id}")
    @PreAuthorize("hasRole('ADMIN') or @progettoAuthService.isCapoProgetto(#request.idProgetto, authentication)")
    public ResponseEntity<String> eliminaAttivitaPerId(@PathVariable("id") Long id){
        attivitaService.eliminaAttivitaPerId(id);
        return ResponseEntity.noContent().build();
    }
}
