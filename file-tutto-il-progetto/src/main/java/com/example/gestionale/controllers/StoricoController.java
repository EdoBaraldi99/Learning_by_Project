package com.example.gestionale.controllers;


import com.example.gestionale.dto.StoricoRequestDTO;
import com.example.gestionale.dto.StoricoResponseDTO;
import com.example.gestionale.services.StoricoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/storici")
public class StoricoController {

    @Autowired
    public StoricoService storicoService;

    @GetMapping("/lista")
    public ResponseEntity<List<StoricoResponseDTO>> listaTuttiStoricii() {
        return ResponseEntity.ok(storicoService.listaStorici());
    }

    @PostMapping("/crea")
    public ResponseEntity<StoricoResponseDTO> creaStorico(@RequestBody StoricoRequestDTO storico, Authentication authentication) {
        return ResponseEntity.status(201).body(storicoService.salvaStorico(storico, authentication));
    }

    @GetMapping("/{id}")
    public ResponseEntity<StoricoResponseDTO> schedaStoricooPerId(@PathVariable("id") Long id) {
        return ResponseEntity.ok(storicoService.schedaStoricoPerId(id));
    }

    @PatchMapping("/modifica/{id}")
    @PreAuthorize("hasRole('ADMIN') or @progettoAuthService.isProprietarioStorico(#id, authentication)")
    public ResponseEntity<StoricoResponseDTO> modificaStoricoPerId(@PathVariable("id") Long id, @RequestBody StoricoRequestDTO storico) {
        return ResponseEntity.ok(storicoService.modificaStorico(id, storico));
    }
}
