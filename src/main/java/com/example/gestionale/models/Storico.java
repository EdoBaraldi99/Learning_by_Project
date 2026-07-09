package com.example.gestionale.models;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "storico")
public class Storico {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long idStorico;
    @Column(name = "data")
    public LocalDate data;
    @Column(name = "descrizione", columnDefinition = "TEXT")
    public String descrizione;
    @Column(name = "tempo_lavorato", nullable = false, length = 20)
    public String tempoLavorato;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_task", nullable = true)
    public Attivita attivita;


    public Storico(){
    }
    public Storico(LocalDate data, String descrizione, String tempoLavorato, Attivita attivita) {
        this.data = data;
        this.descrizione = descrizione;
        this.tempoLavorato = tempoLavorato;
        this.attivita = attivita;
    }

    public long getIdStorico() {return idStorico;}
    public void setIdStorico(Long idStorico) {this.idStorico = idStorico;}
    public LocalDate getData() {return data;}
    public void setData(LocalDate data) {this.data = data;}
    public String getDescrizione() {return descrizione;}
    public void setDescrizione(String descrizione) {this.descrizione = descrizione;}
    public String getTempoLavorato() {return tempoLavorato;}
    public void setTempoLavorato(String tempoLavorato) {this.tempoLavorato = tempoLavorato;}
    public Attivita getAttivita() {return attivita;}
    public void setAttivita(Attivita attivita) {this.attivita = attivita;}
}
