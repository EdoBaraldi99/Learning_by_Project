package com.example.gestionale.models;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;


@Entity
@Table(name = "progetto")
public class Progetto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long idProgetto;
    @Column(name = "nome", nullable = false, length = 50)
    public String nome;
    @Column(name = "descrizione", columnDefinition = "TEXT")
    public String descrizione;
    @Column(name = "stato", nullable = false, length = 20)
    public String stato;
    @Column(name = "data_inizio")
    public LocalDate dataInizio;
    @Column(name = "data_fine")
    public LocalDate dataFine;

    @Column(name = "data_creazione", updatable = false)
    @CreationTimestamp
    public LocalDateTime dataCreazione;
    @Column(name = "data_aggiornamento")
    @UpdateTimestamp
    public LocalDateTime dataAggiornamento;

    @OneToMany(mappedBy = "progetto")
    public List<Attivita> attivita;
    // cascade REMOVE: eliminare il progetto elimina anche le associazioni ai
    // dipendenti (capoprogetto incluso), evitando una violazione del vincolo
    // di chiave esterna su dipendente_associato_progetto.id_progetto
    @OneToMany(mappedBy = "progetto", cascade = CascadeType.REMOVE)
    public List<Associato> associati;

    public Progetto(){
    }
    public Progetto(String nome, String descrizione, String stato, List<Attivita> attivita) {
        this.nome = nome;
        this.descrizione = descrizione;
        this.stato = stato;
        this.attivita = attivita;
    }

    public Long getIdProgetto() {return idProgetto;}
    public void setIdProgetto(Long idProgetto) {this.idProgetto = idProgetto;}
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
    public LocalDateTime getDataCreazione() {return dataCreazione;}
    public LocalDateTime getDataAggiornamento() {return dataAggiornamento;}
    public List<Attivita> getAttivita() {return attivita;}
    public void setAttivita(List<Attivita> attivita) {this.attivita = attivita;}
    public List<Associato> getAssociati() {return associati;}
    public void setAssociati(List<Associato> associati) {this.associati = associati;}
}
