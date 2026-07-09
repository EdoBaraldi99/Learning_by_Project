package com.example.gestionale.controllers;

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

    @GetMapping("/lista")
    public ResponseEntity<List<Associato>> listaTuttiAssociati() {
        List<Associato> associati = associatoService.listaAssociati();
        return ResponseEntity.ok(associati);
    }
    @PostMapping("/dipendente/{idDipendente}/progetto/{idProgetto}")
    public ResponseEntity<Associato> associaDipendenteProgetto(
            @PathVariable("idDipendente") Long idDipendente,
            @PathVariable("idProgetto") Long idProgetto,
            @RequestBody LocalDate dataInizio,
            @RequestBody LocalDate dataFine,
            @RequestBody String ruolo
    ){
        Associato salvaAssociazione = associatoService.associaDipendenteProgetto(idDipendente, idProgetto, dataInizio, dataFine, ruolo);
        return ResponseEntity.ok(salvaAssociazione);
    }
    @DeleteMapping("/elimina/dipendente/{idDipendente}/progetto/{idProgetto}")
    public ResponseEntity<String> cancellaAssociazione(
            @PathVariable("idDipendente") Long idDipendente,
            @PathVariable("idProgetto") Long idProgetto
    ){
        associatoService.cancellaAssociazione(idDipendente, idProgetto);
        return new ResponseEntity<>("Associazione eliminata con successo", HttpStatus.OK);
    }
}
