package com.example.gestionale.controllers;

import com.example.gestionale.models.Storico;
import com.example.gestionale.services.StoricoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/storici")
public class StoricoController {

    @Autowired
    public StoricoService storicoService;

    @GetMapping("/lista")
    public ResponseEntity<List<Storico>> listaTuttiStorici() {
        List<Storico> storici = storicoService.listaStorici();
        return ResponseEntity.ok(storici);
    }
    @PostMapping("/crea")
    public ResponseEntity<Storico> creaStorico(@RequestBody Storico storico){
        Storico nuovoStorico = storicoService.salvaStorico(storico);
        return new ResponseEntity<>(nuovoStorico, HttpStatus.CREATED);
    }
    @GetMapping("/{id}")
    public ResponseEntity<Storico> schedaStoricoById(@PathVariable("id") Long id) {
        Storico storico = storicoService.ottieniStoricoPerId(id);
        return ResponseEntity.ok(storico);
    }
}
