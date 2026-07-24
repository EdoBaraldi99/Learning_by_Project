package com.example.gestionale.dto;

import com.example.gestionale.models.Associato;

import java.time.LocalDate;

public class AssociatoRequestDTO {
    private LocalDate dataInizio;
    private LocalDate dataFine;
    private String ruolo;
    private Long idDipendente;
    private Long idProgetto;

    public AssociatoRequestDTO() {
    }
    public AssociatoRequestDTO(LocalDate dataInizio, LocalDate dataFine, String ruolo, Long idDipendente, Long idProgetto) {
        this.dataInizio = dataInizio;
        this.dataFine = dataFine;
        this.ruolo = ruolo;
        this.idDipendente = idDipendente;
        this.idProgetto = idProgetto;
    }
    public AssociatoRequestDTO(LocalDate dataInizio, LocalDate dataFine, String ruolo){
        this.dataInizio = dataInizio;
        this.dataFine = dataFine;
        this.ruolo = ruolo;
    }

    public Associato toEntity(){
        Associato a = new Associato();
        a.setRuolo(this.ruolo);
        a.setDataInizio(this.dataInizio);
        a.setDataFine(this.dataFine);

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
    public Long getIdProgetto() {return idProgetto;}
    public void setIdProgetto(Long idProgetto) {this.idProgetto = idProgetto;}
}
