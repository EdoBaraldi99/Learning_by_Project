package com.example.gestionale.models;

import jakarta.persistence.*;

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
    public List<Attivita> getAttivita() {return attivita;}
    public void setAttivita(List<Attivita> attivita) {this.attivita = attivita;}
    public List<Associato> getAssociati() {return associati;}
    public void setAssociati(List<Associato> associati) {this.associati = associati;}
}
