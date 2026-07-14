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

    private ProgettoRefDTO progetto;
    private List<StoricoResponseDTO> storico;
    private List<AssegnatoResponseDTO> assegnati;

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
        dto.progetto = ProgettoRefDTO.fromEntity(a.getProgetto());
        if (a.getStorico() != null) {
            dto.storico = a.getStorico().stream().map(StoricoResponseDTO::fromEntity).toList();
        }
        if (a.getAssegnati() != null) {
            dto.assegnati = a.getAssegnati().stream().map(AssegnatoResponseDTO::fromEntity).toList();
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
    public ProgettoRefDTO getProgetto() {return progetto;}
    public void setProgetto(ProgettoRefDTO progetto) {this.progetto = progetto;}
    public List<StoricoResponseDTO> getStorico() {return storico;}
    public void setStorico(List<StoricoResponseDTO> storico) {this.storico = storico;}
    public List<AssegnatoResponseDTO> getAssegnati() {return assegnati;}
    public void setAssegnati(List<AssegnatoResponseDTO> assegnati) {this.assegnati = assegnati;}
}
