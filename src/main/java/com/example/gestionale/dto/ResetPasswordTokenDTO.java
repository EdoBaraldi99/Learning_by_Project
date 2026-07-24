package com.example.gestionale.dto;

import java.time.LocalDateTime;

// Modalità sviluppo: nessun invio email configurato (manca spring-boot-starter-mail
// e la configurazione SMTP), quindi il token viene restituito direttamente nella
// risposta invece che via email. Da rimuovere/sostituire con un invio email reale
// prima di un uso in produzione: esporre il token al client è insicuro.
public class ResetPasswordTokenDTO {
    private String resetToken;
    private LocalDateTime scadenza;

    public ResetPasswordTokenDTO(String resetToken, LocalDateTime scadenza) {
        this.resetToken = resetToken;
        this.scadenza = scadenza;
    }

    public String getResetToken() {return resetToken;}
    public void setResetToken(String resetToken) {this.resetToken = resetToken;}
    public LocalDateTime getScadenza() {return scadenza;}
    public void setScadenza(LocalDateTime scadenza) {this.scadenza = scadenza;}
}
