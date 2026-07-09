package com.example.gestionale.controllers;

import com.example.gestionale.models.Assegnato;
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

    @GetMapping("/lista")
    public ResponseEntity<List<Assegnato>> listaTuttiAssegnati() {
        List<Assegnato> assegnati = assegnatoService.listaAssegnati();
        return ResponseEntity.ok(assegnati);
    }
    @PostMapping("/dipendente/{idDipendente}/attivita/{idTask}")
    public ResponseEntity<Assegnato> assegnaDipendenteAttivita(
            @PathVariable("idDipendente") Long idDipendente,
            @PathVariable("idTask") Long idTask,
            @RequestBody LocalDate dataInizio,
            @RequestBody LocalDate dataFine,
            @RequestBody String ruolo
        ){
        Assegnato salvaAssegnazione = assegnatoService.assegnaDipendenteAttivita(idDipendente, idTask, dataInizio, dataFine, ruolo);
        return ResponseEntity.ok(salvaAssegnazione);
    }
    @DeleteMapping("/elimina/dipendente/{idDipendente}/attivita/{idTask}")
    public ResponseEntity<String> cancellaAssegnazione(
            @PathVariable("idDipendente") Long idDipendente,
            @PathVariable("idTask") Long idTask
        ){
        assegnatoService.cancellaAssegnazione(idDipendente, idTask);
        return new ResponseEntity<>("Assegnazione eliminata con successo",HttpStatus.OK);
    }
}
