package com.example.gestionale.dto;

import com.example.gestionale.models.Storico;
import java.time.LocalDate;

public class StoricoResponseDTO {
    private Long idStorico;
    private LocalDate data;
    private String descrizione;
    private String tempoLavorato;

    private AttivitaRefDTO attivita;

    public StoricoResponseDTO() {
    }
    public static StoricoResponseDTO fromEntity(Storico s) {
        StoricoResponseDTO dto = new StoricoResponseDTO();
        dto.idStorico = s.getIdStorico();
        dto.data = s.getData();
        dto.descrizione = s.getDescrizione();
        dto.tempoLavorato = s.getTempoLavorato();
        dto.attivita = AttivitaRefDTO.fromEntity(s.getAttivita());
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
    public AttivitaRefDTO getAttivita() {return attivita;}
    public void setAttivita(AttivitaRefDTO attivita) {this.attivita = attivita;}
}
