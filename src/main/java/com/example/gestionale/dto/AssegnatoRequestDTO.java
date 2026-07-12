package com.example.gestionale.dto;

import com.example.gestionale.models.Assegnato;

import java.time.LocalDate;

public class AssegnatoRequestDTO {
    private LocalDate dataInizio;
    private LocalDate dataFine;
    private String ruolo;
    private Long idDipendente;
    private Long idAttivita;

    public AssegnatoRequestDTO() {
    }
    public AssegnatoRequestDTO(LocalDate dataInizio, LocalDate dataFine, String ruolo, Long idDipendente, Long idAttivita) {
        this.dataInizio = dataInizio;
        this.dataFine = dataFine;
        this.ruolo = ruolo;
        this.idDipendente = idDipendente;
        this.idAttivita = idAttivita;
    }
    public AssegnatoRequestDTO(LocalDate dataInizio, LocalDate dataFine, String ruolo){
        this.dataInizio = dataInizio;
        this.dataFine = dataFine;
        this.ruolo = ruolo;
    }

    public Assegnato toEntity(){
        Assegnato a = new Assegnato();
        a.setRuolo(this.ruolo);
        a.setDataInizioAttivita(this.dataInizio);
        a.setDataFineAttivita(this.dataFine);

        return a;
    }

    public LocalDate getDataInizio() {return dataInizio;}
    public void setDataInizio(LocalDate dataInizio) {this.dataInizio = dataInizio;}
    public LocalDate getDataFine() {return dataFine;}
    public void setDataFine(LocalDate dataFine) {this.dataFine = dataFine;}
    public String getRuolo() {return ruolo;}
    public void setRuolo(String ruolo) {this.ruolo = ruolo;}
    public Long getIdDipendente() {return idDipendente;}
    public void setIdDipendente(Long idDipendente) {this.idDipendente = idDipendente;}
    public Long getIdAttivita() {return idAttivita;}
    public void setIdAttivita(Long idAttivita) {this.idAttivita = idAttivita;}
}
