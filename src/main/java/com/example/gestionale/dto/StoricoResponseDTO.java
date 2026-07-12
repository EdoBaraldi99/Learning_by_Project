package com.example.gestionale.dto;

import com.example.gestionale.models.Storico;
import java.time.LocalDate;

public class StoricoResponseDTO {
    private Long idStorico;
    private LocalDate data;
    private String descrizione;
    private String tempoLavorato;
    private Long idTask;
    private String titoloTask;

    public StoricoResponseDTO() {
    }

    public static StoricoResponseDTO fromEntity(Storico s) {
        StoricoResponseDTO dto = new StoricoResponseDTO();
        dto.idStorico = s.getIdStorico();
        dto.data = s.getData();
        dto.descrizione = s.getDescrizione();
        dto.tempoLavorato = s.getTempoLavorato();
        if (s.getAttivita() != null) {
            dto.idTask = s.getAttivita().getIdTask();
            dto.titoloTask = s.getAttivita().getTitolo();
        }
        return dto;
    }

    public Long getIdStorico() {return idStorico;}
    public void setIdStorico(Long idStorico) {this.idStorico = idStorico;}
    public LocalDate getData() {return data;}
    public void setData(LocalDate data) {this.data = data;}
    public String getDescrizione() {return descrizione;}
    public void setDescrizione(String descrizione) {this.descrizione = descrizione;}
    public String getTempoLavorato() {return tempoLavorato;}
    public void setTempoLavorato(String tempoLavorato) {this.tempoLavorato = tempoLavorato;}
    public Long getIdTask() {return idTask;}
    public void setIdTask(Long idTask) {this.idTask = idTask;}
    public String getTitoloTask() {return titoloTask;}
    public void setTitoloTask(String titoloTask) {this.titoloTask = titoloTask;}
}
