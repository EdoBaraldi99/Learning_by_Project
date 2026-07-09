package com.example.gestionale.controllers;

import com.example.gestionale.models.Attivita;
import com.example.gestionale.services.AttivitaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/attivita")
public class AttivitaController {

    @Autowired
    public AttivitaService attivitaService;

    @GetMapping("/lista")
    public ResponseEntity<List<Attivita>> listaTutteAttivita() {
        List<Attivita> attivita = attivitaService.listaAttivita();
        return ResponseEntity.ok(attivita);
    }
    @PostMapping("/crea")
    public ResponseEntity<Attivita> creaAttivita(@RequestBody Attivita attivita){
        Attivita nuovaAttivita = attivitaService.salvaAttivita(attivita);
        return new ResponseEntity<>(nuovaAttivita, HttpStatus.CREATED);
    }
    @GetMapping("/{id}")
    public ResponseEntity<Attivita> schedaAttivitaPerId(@PathVariable("id") Long id) {
        Attivita attivita = attivitaService.ottieniAttivitaPerId(id);
        return ResponseEntity.ok(attivita);
    }
    @PutMapping("/modifica/{id}")
    public ResponseEntity<Attivita> modificaAttivitaById(@PathVariable("id") Long id, @RequestBody Attivita attivita){
        Attivita attivitaModificata = attivitaService.modificaAttivitaPerId(id, attivita);
        return new ResponseEntity<>(attivitaModificata, HttpStatus.CREATED);
    }
    @DeleteMapping("/elimina/{id}")
    public ResponseEntity<String> eliminaAttivitaPerId(@PathVariable("id") Long id){
         attivitaService.eliminaAttivitaPerId(id);
        return new ResponseEntity<>("Task eliminata con successo", HttpStatus.OK);
    }
}
