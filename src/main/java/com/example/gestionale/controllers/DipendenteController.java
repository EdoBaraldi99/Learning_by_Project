package com.example.gestionale.controllers;

import com.example.gestionale.models.Dipendente;
import com.example.gestionale.services.DipendenteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/dipendenti")
public class DipendenteController {

    @Autowired
    public DipendenteService dipendenteService;

    @GetMapping("/lista")
    public ResponseEntity<List<Dipendente>> listaTuttiDipendenti() {
        List<Dipendente> dipendenti = dipendenteService.listaDipendenti();
        return ResponseEntity.ok(dipendenti);
    }
    @PostMapping("/crea")
    public ResponseEntity<Dipendente> creaDipendente(@RequestBody Dipendente dipendente){
        Dipendente nuovoDipendente = dipendenteService.salvaDipendente(dipendente);
        return new ResponseEntity<>(nuovoDipendente, HttpStatus.CREATED);
    }
    @GetMapping("/{id}")
    public ResponseEntity<Dipendente> schedaDipendenteById(@PathVariable("id") Long id) {
        Dipendente dipendente = dipendenteService.ottieniDipendentePerId(id);
        return ResponseEntity.ok(dipendente);
    }
    @PutMapping("/modifica/{id}")
    public ResponseEntity<Dipendente> modificaDipendenteById(@PathVariable("id") Long id, @RequestBody Dipendente dipendente){
        Dipendente dipendenteModificato = dipendenteService.modificaDipendentePerId(id, dipendente);
        return new ResponseEntity<>(dipendenteModificato, HttpStatus.CREATED);
    }
    @DeleteMapping("/elimina/{id}")
    public ResponseEntity<String> eliminaDipendentePerId(@PathVariable("id") Long id){
        dipendenteService.eliminaDipendentePerId(id);
        return new ResponseEntity<>("Task eliminata con successo", HttpStatus.OK);
    }
}
