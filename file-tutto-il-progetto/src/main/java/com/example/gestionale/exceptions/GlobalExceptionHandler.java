package com.example.gestionale.exceptions;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(EntitaNonTrovata.class)
    public ResponseEntity<Errore> handleEntityNotFound(EntitaNonTrovata ex, HttpServletRequest request) {
        Errore error = new Errore(
                HttpStatus.NOT_FOUND.value(),
                HttpStatus.NOT_FOUND.getReasonPhrase(),
                ex.getMessage(),
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Errore> handleIllegalArgument(IllegalArgumentException ex, HttpServletRequest request) {
        Errore error = new Errore(
                HttpStatus.BAD_REQUEST.value(),
                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                ex.getMessage(),
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Errore> handleIllegalState(IllegalStateException ex,
                                                            HttpServletRequest request) {
        Errore error = new Errore(
                HttpStatus.CONFLICT.value(), // 409, più corretto di 400 per questo caso
                HttpStatus.CONFLICT.getReasonPhrase(),
                ex.getMessage(),
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Errore> handleBadCredentials(BadCredentialsException ex, HttpServletRequest request) {
        Errore error = new Errore(
                HttpStatus.UNAUTHORIZED.value(), "Unauthorized", ex.getMessage(), request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Errore> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        Errore error = new Errore(
                HttpStatus.FORBIDDEN.value(),
                HttpStatus.FORBIDDEN.getReasonPhrase(),
                "Non hai i permessi per eseguire questa operazione",
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex,
                                                                HttpServletRequest request) {
        Map<String, String> erroriCampi = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(err ->
                erroriCampi.put(err.getField(), err.getDefaultMessage())
        );
        // "messaggio" accanto a "fields": il frontend (parseErrorMessage in ogni
        // pagina) legge sempre body.messaggio per mostrare l'errore nel form,
        // stesso campo usato da tutti gli altri handler di questa classe — senza
        // questo l'utente vedeva solo "Errore API: 400" invece del vero motivo.
        String messaggio = String.join("; ", erroriCampi.values());

        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", java.time.LocalDateTime.now());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", "Validation Failed");
        body.put("messaggio", messaggio);
        body.put("path", request.getRequestURI());
        body.put("fields", erroriCampi);

        return ResponseEntity.badRequest().body(body);
    }
    // Rete di sicurezza per qualsiasi eccezione non gestita esplicitamente
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Errore> handleGeneric(Exception ex, HttpServletRequest request) {
        Errore error = new Errore(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase(),
                "Si è verificato un errore imprevisto",
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
