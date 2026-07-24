package com.example.gestionale.controllers;

import com.example.gestionale.dto.DipendenteResponseDTO;
import com.example.gestionale.dto.LoginRequestDTO;
import com.example.gestionale.dto.LoginResponseDTO;
import com.example.gestionale.dto.RegistrazioneDTO;
import com.example.gestionale.dto.ResetPasswordDTO;
import com.example.gestionale.dto.ResetPasswordTokenDTO;
import com.example.gestionale.dto.RichiestaResetPasswordDTO;
import com.example.gestionale.models.Dipendente;
import com.example.gestionale.security.JwtUtil;
import com.example.gestionale.services.DipendenteService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {
    @Autowired
    private DipendenteService dipendenteService;
    @Autowired
    private AuthenticationManager authenticationManager;
    @Autowired
    private JwtUtil jwtUtil;

    public AuthController(AuthenticationManager authenticationManager, JwtUtil jwtUtil) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/login")
    public LoginResponseDTO login(@RequestBody LoginRequestDTO request) {
        try {
            var auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
            Dipendente dipendente = (Dipendente) auth.getPrincipal();
            String token = jwtUtil.generaToken(dipendente);
            return new LoginResponseDTO(token, dipendente);
        } catch (Exception e) {
            throw new BadCredentialsException("Email o password non corretti");
        }
    }
    @PostMapping("/registrazione")
    public ResponseEntity<DipendenteResponseDTO> registrazione(@Valid @RequestBody RegistrazioneDTO request) {
        DipendenteResponseDTO creato = dipendenteService.registra(request);
        return ResponseEntity.status(201).body(creato);
    }

    // MODALITÀ SVILUPPO: nessun invio email configurato — il token di reset viene
    // restituito qui invece di essere spedito via email (vedi DipendenteService).
    @PostMapping("/password-dimenticata")
    public ResponseEntity<ResetPasswordTokenDTO> richiediResetPassword(@Valid @RequestBody RichiestaResetPasswordDTO request) {
        return ResponseEntity.ok(dipendenteService.richiediResetPassword(request.getEmail()));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordDTO request) {
        dipendenteService.confermaResetPassword(request.getToken(), request.getNuovaPassword());
        return ResponseEntity.noContent().build();
    }
}
