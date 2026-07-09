package com.example.gestionale.models;


import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "dipendente_assegna_task")
public class Assegnato {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long idDipendenteAssegnaTask;
    @Column(name = "data_inizio")
    public LocalDate dataInizio;
    @Column(name = "data_fine")
    public LocalDate dataFine;
    @Column(name = "ruolo", nullable = false, length = 20)
    public String ruolo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_dipendente", nullable = true)
    public Dipendente dipendente;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_task", nullable = true)
    public Attivita attivita;

    public Assegnato() {
    }
    public Assegnato(Dipendente dipendente, Attivita attivita, LocalDate dataInizio, LocalDate dataFine, String ruolo) {
        this.dipendente = dipendente;
        this.attivita = attivita;
        this.dataInizio = dataInizio;
        this.dataFine = dataFine;
        this.ruolo = ruolo;
    }

    public Dipendente getDipendente() {return dipendente;}
    public void setDipendente(Dipendente dipendente) {this.dipendente = dipendente;}
    public Attivita getAttivita() {return attivita;}
    public void setAttivita(Attivita attivita) {this.attivita = attivita;}
    public LocalDate getDataInizio() {return dataInizio;}
    public void setDataInizio(LocalDate dataInizio) {this.dataInizio = dataInizio;}
    public LocalDate getDataFine() {return dataFine;}
    public void setDataFine(LocalDate dataFine) {this.dataFine = dataFine;}
    public String getRuolo() {return ruolo;}
    public void setRuolo(String ruolo) {this.ruolo = ruolo;}
}
