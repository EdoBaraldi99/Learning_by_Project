package com.example.gestionale.dto;

import com.example.gestionale.models.Assegnato;
import com.example.gestionale.models.Attivita;
import com.example.gestionale.models.Storico;

import java.time.LocalDate;
import java.util.List;

public class AttivitaResponseDTO {
    private Long idTask;
    private String titolo;
    private String descrizione;
    private LocalDate dataAssegnazione;
    private LocalDate scadenza;
    private String tempoStimato;
    private String stato;
    private String tipologia;
    private String priorita;

    private Long idProgetto;
    private String nomeProgetto;

    private List<Long> storicoIds;
    private List<Long> assegnatiIds;

    public AttivitaResponseDTO() {
    }

    public static AttivitaResponseDTO fromEntity(Attivita a) {
        AttivitaResponseDTO dto = new AttivitaResponseDTO();
        dto.idTask = a.getIdTask();
        dto.titolo = a.getTitolo();
        dto.descrizione = a.getDescrizione();
        dto.dataAssegnazione = a.getDataAssegnazione();
        dto.scadenza = a.getDataScadenza();
        dto.tempoStimato = a.getTempoStimato();
        dto.stato = a.getStato();
        dto.tipologia = a.getTipologia();
        dto.priorita = a.getPriorita();
        if (a.getProgetto() != null) {
            dto.idProgetto = a.getProgetto().getIdProgetto();
            dto.nomeProgetto = a.getProgetto().getNome();
        }
        if (a.getStorico() != null) {
            dto.storicoIds = a.getStorico().stream().map(Storico::getIdStorico).toList();
        }
        if (a.getAssegnati() != null) {
            dto.assegnatiIds = a.getAssegnati().stream()
                    .map(Assegnato::getIdDipendenteAssegnaTask)
                    .toList();
        }
        return dto;
    }

    public Long getIdTask() {return idTask;}
    public void setIdTask(Long idTask) {this.idTask = idTask;}
    public String getTitolo() {return titolo;}
    public void setTitolo(String titolo) {this.titolo = titolo;}
    public String getDescrizione() {return descrizione;}
    public void setDescrizione(String descrizione) {this.descrizione = descrizione;}
    public LocalDate getDataAssegnazione() {return dataAssegnazione;}
    public void setDataAssegnazione(LocalDate dataAssegnazione) {this.dataAssegnazione = dataAssegnazione;}
    public LocalDate getScadenza() {return scadenza;}
    public void setScadenza(LocalDate scadenza) {this.scadenza = scadenza;}
    public String getTempoStimato() {return tempoStimato;}
    public void setTempoStimato(String tempoStimato) {this.tempoStimato = tempoStimato;}
    public String getStato() {return stato;}
    public void setStato(String stato) {this.stato = stato;}
    public String getTipologia() {return tipologia;}
    public void setTipologia(String tipologia) {this.tipologia = tipologia;}
    public String getPriorita() {return priorita;}
    public void setPriorita(String priorita) {this.priorita = priorita;}
    public Long getIdProgetto() {return idProgetto;}
    public void setIdProgetto(Long idProgetto) {this.idProgetto = idProgetto;}
    public String getNomeProgetto() {return nomeProgetto;}
    public void setNomeProgetto(String nomeProgetto) {this.nomeProgetto = nomeProgetto;}
    public List<Long> getStoricoIds() {return storicoIds;}
    public void setStoricoIds(List<Long> storicoIds) {this.storicoIds = storicoIds;}
    public List<Long> getAssegnatiIds() {return assegnatiIds;}
    public void setAssegnatiIds(List<Long> assegnatiIds) {this.assegnatiIds = assegnatiIds;}
}
