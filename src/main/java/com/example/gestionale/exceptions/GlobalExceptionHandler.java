package com.example.gestionale.exceptions;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

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
