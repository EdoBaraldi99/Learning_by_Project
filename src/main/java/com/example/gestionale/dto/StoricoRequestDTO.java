package com.example.gestionale.dto;

import com.example.gestionale.models.Attivita;
import com.example.gestionale.models.Storico;

import java.time.LocalDate;

public class StoricoRequestDTO {
    private LocalDate data;
    private String descrizione;
    private String tempoLavorato;
    private Long idTask;

    public StoricoRequestDTO() {
    }
    public StoricoRequestDTO(LocalDate data, String descrizione, String tempoLavorato, Long idTask) {
        this.data = data;
        this.descrizione = descrizione;
        this.tempoLavorato = tempoLavorato;
        this.idTask = idTask;
    }
    public StoricoRequestDTO(LocalDate data, String descrizione, String tempoLavorato){
        this.data = data;
        this.descrizione = descrizione;
        this.tempoLavorato = tempoLavorato;
    }

    public Storico toEntity(){
        Storico s = new Storico();
        s.setData(this.data);
        s.setDescrizione(this.descrizione);
        s.setTempoLavorato(this.tempoLavorato);
        return s;
    }


    public LocalDate getData() {return data;}
    public void setData(LocalDate data) {this.data = data;}
    public String getDescrizione() {return descrizione;}
    public void setDescrizione(String descrizione) {this.descrizione = descrizione;}
    public String getTempoLavorato() {return tempoLavorato;}
    public void setTempoLavorato(String tempoLavorato) {this.tempoLavorato = tempoLavorato;}
    public Long getIdTask() {return idTask;}
    public void setIdTask(Long idTask) {this.idTask = idTask;}
}
