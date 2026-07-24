package com.example.gestionale.exceptions;

import java.time.LocalDateTime;

public class Errore {
    private LocalDateTime timestamp;
    private int status;
    private String errore;
    private String messaggio;
    private String path;

    public Errore(int status, String errore, String messaggio, String path) {
        this.timestamp = LocalDateTime.now();
        this.status = status;
        this.errore = errore;
        this.messaggio = messaggio;
        this.path = path;
    }

    public LocalDateTime getTimestamp() {return timestamp;}
    public int getStatus() {return status;}
    public String getErrore() {return errore;}
    public String getMessaggio() {return messaggio;}
    public String getPath() {return path;}
}
