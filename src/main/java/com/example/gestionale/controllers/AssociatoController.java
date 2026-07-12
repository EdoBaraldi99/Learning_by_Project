package com.example.gestionale.controllers;

import com.example.gestionale.dto.AssociatoRequestDTO;
import com.example.gestionale.dto.AssociatoResponseDTO;
import com.example.gestionale.models.Associato;
import com.example.gestionale.services.AssociatoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/associati")
public class AssociatoController {

    @Autowired
    public AssociatoService associatoService;

    @GetMapping
    public List<AssociatoResponseDTO> listaAssociazioni() {
        return associatoService.listaAssociati();
    }
    @GetMapping("/{id}")
    public ResponseEntity<AssociatoResponseDTO> associazionePerId(@PathVariable Long id) {
        return ResponseEntity.ok(associatoService.schedaAssociatoPerId(id));
    }
    @PostMapping
    public ResponseEntity<AssociatoResponseDTO> associaDipendenteProgetto(@RequestBody AssociatoRequestDTO associato) {
        AssociatoResponseDTO creato = associatoService.associaDipendenteProgetto(associato);
        return ResponseEntity.status(201).body(creato);
    }
    @PatchMapping("/{id}")
    public ResponseEntity<AssociatoResponseDTO> modificaAssociazione(@PathVariable Long id, @RequestBody AssociatoRequestDTO associato) {
        return ResponseEntity.ok(associatoService.modificaAssociazione(id, associato));
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminaAssociazione(@PathVariable Long id) {
        associatoService.eliminaAssociazione(id);
        return ResponseEntity.noContent().build();
    }
    @GetMapping("/dipendente/{idDipendente}")
    public ResponseEntity<List<AssociatoResponseDTO>> trovaPerDipendente(@PathVariable Long idDipendente) {
        return ResponseEntity.ok(associatoService.trovaPerDipendente(idDipendente));
    }
    @GetMapping("/progetto/{idProgetto}")
    public ResponseEntity<List<AssociatoResponseDTO>> trovaPerProgetto(@PathVariable Long idProgetto) {
        return ResponseEntity.ok(associatoService.trovaPerProgetto(idProgetto));
    }
}
