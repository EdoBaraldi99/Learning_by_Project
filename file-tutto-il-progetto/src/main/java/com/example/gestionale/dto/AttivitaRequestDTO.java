package com.example.gestionale.dto;

import com.example.gestionale.models.Attivita;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public class AttivitaRequestDTO {
    @NotBlank(message = "Il titolo è obbligatorio")
    private String titolo;
    private String descrizione;
    private LocalDate dataAssegnazione;
    private LocalDate scadenza;
    @NotBlank(message = "Il tempo stimato è obbligatorio")
    private String tempoStimato;
    @NotBlank(message = "Lo stato è obbligatorio")
    private String stato;
    @NotBlank(message = "La tipologia è obbligatoria")
    private String tipologia;
    @NotBlank(message = "La priorità è obbligatoria")
    private String priorita;
    private Long idProgetto; // solo l'ID, non l'oggetto Progetto intero

    public AttivitaRequestDTO() {
    }
    public AttivitaRequestDTO(String titolo, String descrizione, LocalDate dataAssegnazione, LocalDate scadenza, String tempoStimato, String stato, String tipologia, String priorita, Long idProgetto) {
        this.titolo = titolo;
        this.descrizione = descrizione;
        this.dataAssegnazione = dataAssegnazione;
        this.scadenza = scadenza;
        this.tempoStimato = tempoStimato;
        this.stato = stato;
        this.tipologia = tipologia;
        this.priorita = priorita;
        this.idProgetto = idProgetto;
    }
    public AttivitaRequestDTO(String titolo, String descrizione, LocalDate dataAssegnazione, LocalDate scadenza, String tempoStimato, String stato, String tipologia, String priorita){
        this.titolo = titolo;
        this.descrizione = descrizione;
        this.dataAssegnazione = dataAssegnazione;
        this.scadenza = scadenza;
        this.tempoStimato = tempoStimato;
        this.stato = stato;
        this.tipologia = tipologia;
        this.priorita = priorita;
    }

    public Attivita toEntity(){
        Attivita a = new Attivita();
        a.setTitolo(this.titolo);
        a.setTipologia(this.tipologia);
        a.setPriorita(this.priorita);
        a.setDescrizione(this.descrizione);
        a.setDataAssegnazione(this.dataAssegnazione);
        a.setDataScadenza(this.scadenza);
        a.setStato(this.stato);
        a.setTempoStimato(this.tempoStimato);

        return a;
    }

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
}
