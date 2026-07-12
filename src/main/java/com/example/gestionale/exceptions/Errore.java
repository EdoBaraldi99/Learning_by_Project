package com.example.gestionale.exceptions;

import java.time.LocalDateTime;

public class Errore {
    private LocalDateTime timestamp;
    private int status;
    private String errore;
    private String messagggio;
    private String path;

    public Errore(int status, String errore, String messagggio, String path) {
        this.timestamp = LocalDateTime.now();
        this.status = status;
        this.errore = errore;
        this.messagggio = messagggio;
        this.path = path;
    }

    public LocalDateTime getTimestamp() {return timestamp;}
    public int getStatus() {return status;}
    public String getErrore() {return errore;}
    public String getMessaggio() {return messagggio;}
    public String getPath() {return path;}
}
