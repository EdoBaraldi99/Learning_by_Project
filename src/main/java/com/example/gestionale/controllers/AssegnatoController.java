package com.example.gestionale.controllers;

import com.example.gestionale.dto.AssegnatoRequestDTO;
import com.example.gestionale.dto.AssegnatoResponseDTO;
import com.example.gestionale.services.AssegnatoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/assegnati")
public class AssegnatoController {
    @Autowired
    AssegnatoService assegnatoService;

    @GetMapping
    public List<AssegnatoResponseDTO> listaAssegnazioni() {
        return assegnatoService.listaAssegnati();
    }
    @GetMapping("/{id}")
    public ResponseEntity<AssegnatoResponseDTO> assegnazionePerId(@PathVariable Long id) {
        return ResponseEntity.ok(assegnatoService.schedaAssegnatoPerId(id));
    }
    @PostMapping
    public ResponseEntity<AssegnatoResponseDTO> assegnaDipendenteAttivita(@RequestBody AssegnatoRequestDTO assegnato) {
        AssegnatoResponseDTO creato = assegnatoService.assegnaDipendenteAttivita(assegnato);
        return ResponseEntity.status(201).body(creato);
    }
    @PatchMapping("/{id}")
    public ResponseEntity<AssegnatoResponseDTO> modificaAssegnazione(@PathVariable Long id, @RequestBody AssegnatoRequestDTO assegnato) {
        return ResponseEntity.ok(assegnatoService.modificaAssegnazione(id, assegnato));
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminaAssegnazione(@PathVariable Long id) {
        assegnatoService.eliminaAssegnazione(id);
        return ResponseEntity.noContent().build();
    }
    @GetMapping("/dipendente/{idDipendente}")
    public ResponseEntity<List<AssegnatoResponseDTO>> trovaPerDipendente(@PathVariable Long idDipendente) {
        return ResponseEntity.ok(assegnatoService.trovaPerDipendente(idDipendente));
    }
    @GetMapping("/attivita/{idTask}")
    public ResponseEntity<List<AssegnatoResponseDTO>> trovaPerAttivita(@PathVariable Long idTask) {
        return ResponseEntity.ok(assegnatoService.trovaPerAttivita(idTask));
    }
}
