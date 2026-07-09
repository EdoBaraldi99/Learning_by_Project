package com.example.gestionale.controllers;

import com.example.gestionale.models.Progetto;
import com.example.gestionale.services.ProgettoService;
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
    public ResponseEntity<List<Progetto>> listaTuttiProgetti() {
        List<Progetto> progetti = progettoService.listaProgetti();
        return ResponseEntity.ok(progetti);
    }
    @PostMapping("/crea")
    public ResponseEntity<Progetto> creaProgetto(@RequestBody Progetto progetto){
        Progetto nuovoProgetto = progettoService.salvaProgetto(progetto);
        return new ResponseEntity<>(nuovoProgetto, HttpStatus.CREATED);
    }
    @GetMapping("/{id}")
    public ResponseEntity<Progetto> schedaProgettoPerId(@PathVariable("id") Long id) {
        Progetto progetto = progettoService.ottieniProgettoPerId(id);
        return ResponseEntity.ok(progetto);
    }
    @PutMapping("/modifica/{id}")
    public ResponseEntity<Progetto> modificaProgettoPerId(@PathVariable("id") Long id, @RequestBody Progetto progetto){
        Progetto progettoModificato = progettoService.modificaProgettoPerId(id, progetto);
        return new ResponseEntity<>(progettoModificato, HttpStatus.CREATED);
    }
    @DeleteMapping("/elimina/{id}")
    public ResponseEntity<String> eliminaprogettoPerId(@PathVariable("id") Long id){
        progettoService.eliminaProgettoPerId(id);
        return new ResponseEntity<>("Progetto eliminato con successo", HttpStatus.OK);
    }
}
