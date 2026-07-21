package com.example.gestionale.dto;

import com.example.gestionale.models.Progetto;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public class ProgettoRequestDTO {
    @NotBlank(message = "Il nome del progetto è obbligatorio")
    private String nome;
    private String descrizione;
    @NotBlank(message = "Lo stato del progetto è obbligatorio")
    private String stato;
    private LocalDate dataInizio;
    private LocalDate dataFine;

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
        p.setDataInizio(this.dataInizio);
        p.setDataFine(this.dataFine);
        return p;
    }

    public String getNome() {return nome;}
    public void setNome(String nome) {this.nome = nome;}
    public String getDescrizione() {return descrizione;}
    public void setDescrizione(String descrizione) {this.descrizione = descrizione;}
    public String getStato() {return stato;}
    public void setStato(String stato) {this.stato = stato;}
    public LocalDate getDataInizio() {return dataInizio;}
    public void setDataInizio(LocalDate dataInizio) {this.dataInizio = dataInizio;}
    public LocalDate getDataFine() {return dataFine;}
    public void setDataFine(LocalDate dataFine) {this.dataFine = dataFine;}
}
