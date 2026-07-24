package com.example.gestionale.models;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "task")
public class Attivita {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long idTask;
    @Column(name = "titolo", nullable = false, length = 50)
    public String titolo;
    @Column(name = "descrizione", columnDefinition = "TEXT")
    public String descrizione;
    @Column(name = "data_assegnazione")
    public LocalDate dataAssegnazione;
    @Column(name = "scadenza")
    public LocalDate scadenza;
    @Column(name = "tempo_stimato",nullable = false, length = 50)
    public String tempoStimato;
    @Column(name = "stato", nullable = false, length = 20)
    public String stato;
    @Column(name = "tipologia", nullable = false, length = 50)
    public String tipologia;
    @Column(name = "priorita", nullable = false, length = 20)
    public String priorita;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_progetto", nullable = true)
    public Progetto progetto;
    @OneToMany(mappedBy = "attivita", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<Storico> storico;
    @OneToMany(mappedBy = "attivita")
    public List<Assegnato> assegnati;

    public Attivita(){
    }
    public Attivita(String titolo, String descrizione, LocalDate dataAssegnazione, LocalDate scadenza, String tempoStimato, String stato, String tipologia, String priorita, Progetto progetto, List<Storico> storico, List<Assegnato> assegnati) {
        this.titolo = titolo;
        this.descrizione = descrizione;
        this.dataAssegnazione = dataAssegnazione;
        this.scadenza = scadenza;
        this.tempoStimato = tempoStimato;
        this.stato = stato;
        this.tipologia = tipologia;
        this.priorita = priorita;
        this.progetto = progetto;
        this.storico = storico;
        this.assegnati = assegnati;
    }

    public Long getIdTask() {return idTask;}
    public void setIdTask(Long idTask) {this.idTask = idTask;}
    public String getTitolo() {return titolo;}
    public void setTitolo(String titolo) {this.titolo = titolo;}
    public String getDescrizione() {return descrizione;}
    public void setDescrizione(String descrizione) {this.descrizione = descrizione;}
    public LocalDate getDataAssegnazione() {return dataAssegnazione;}
    public void setDataAssegnazione(LocalDate dataAssegnazione) {this.dataAssegnazione = dataAssegnazione;}
    public LocalDate getDataScadenza() {return scadenza;}
    public void setDataScadenza(LocalDate scadenza) {this.scadenza = scadenza;}
    public String getTempoStimato() {return tempoStimato;}
    public void setTempoStimato(String tempoStimato) {this.tempoStimato = tempoStimato;}
    public String getStato() {return stato;}
    public void setStato(String stato) {this.stato = stato;}
    public String getTipologia() {return tipologia;}
    public void setTipologia(String tipologia) {this.tipologia = tipologia;}
    public String getPriorita() {return priorita;}
    public void setPriorita(String priorita) {this.priorita = priorita;}
    public Progetto getProgetto() {return progetto;}
    public void setProgetto(Progetto progetto) {this.progetto = progetto;}
    public List<Storico> getStorico() {return storico;}
    public void setStorico(List<Storico> storico) {this.storico = storico;}
    public List<Assegnato> getAssegnati() {return assegnati;}
    public void setAssegnati(List<Assegnato> assegnati) {this.assegnati = assegnati;}
}
