package com.example.gestionale.dto;

import com.example.gestionale.models.Progetto;

public class ProgettoRequestDTO {
    private String nome;
    private String descrizione;
    private String stato;

    public ProgettoRequestDTO() {
    }

    public ProgettoRequestDTO(String nome, String descrizione, String stato) {
        this.nome = nome;
        this.descrizione = descrizione;
        this.stato = stato;
    }

    public Progetto toEntity() {
        Progetto p = new Progetto();
        p.setNome(this.nome);
        p.setDescrizione(this.descrizione);
        p.setStato(this.stato);
        return p;
    }

    public String getNome() {return nome;}
    public void setNome(String nome) {this.nome = nome;}
    public String getDescrizione() {return descrizione;}
    public void setDescrizione(String descrizione) {this.descrizione = descrizione;}
    public String getStato() {return stato;}
    public void setStato(String stato) {this.stato = stato;}
}
