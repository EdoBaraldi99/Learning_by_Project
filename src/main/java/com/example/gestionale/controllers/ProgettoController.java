package com.example.gestionale.controllers;

import com.example.gestionale.dto.ProgettoRequestDTO;
import com.example.gestionale.dto.ProgettoResponseDTO;
import com.example.gestionale.exceptions.EntitaNonTrovata;
import com.example.gestionale.models.Progetto;
import com.example.gestionale.services.ProgettoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/progetti")
public class ProgettoController {

    @Autowired
    public ProgettoService progettoService;

    @GetMapping("/lista")
    public ResponseEntity<List<ProgettoResponseDTO>> listaTuttiProgetti() {
        return ResponseEntity.ok(progettoService.listaProgetti());
    }
    @PostMapping("/crea")
    public ResponseEntity<ProgettoResponseDTO> creaProgetto(@Valid @RequestBody ProgettoRequestDTO progetto){
        return ResponseEntity.status(201).body(progettoService.salvaProgetto(progetto));
    }
    @GetMapping("/{id}")
    public ResponseEntity<ProgettoResponseDTO> schedaProgettoPerId(@PathVariable("id") Long id) {
        return ResponseEntity.ok(progettoService.schedaProgettoPerId(id));
    }
    @PatchMapping("/modifica/{id}")
    public ResponseEntity<ProgettoResponseDTO> modificaProgettoPerId(@PathVariable("id") Long id, @RequestBody ProgettoRequestDTO progetto){
        return ResponseEntity.ok(progettoService.modificaProgettoPerId(id, progetto));
    }
    @DeleteMapping("/elimina/{id}")
    public ResponseEntity<String> eliminaProgettoPerId(@PathVariable("id") Long id){
        progettoService.eliminaProgettoPerId(id);
        return ResponseEntity.noContent().build();
    }
}
