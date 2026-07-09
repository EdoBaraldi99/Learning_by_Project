package com.example.gestionale.models;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "dipendente_associato_progetto")
public class Associato {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long idDipendenteAssociatoProgetto;
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
    @JoinColumn(name = "id_progetto", nullable = true)
    public Progetto progetto;

    public Associato() {
    }
    public Associato(LocalDate dataInizio, LocalDate dataFine, String ruolo, Dipendente dipendente, Progetto progetto) {
        this.dataInizio = dataInizio;
        this.dataFine = dataFine;
        this.ruolo = ruolo;
        this.dipendente = dipendente;
        this.progetto = progetto;
    }

    public LocalDate getDataInizio() {return dataInizio;}
    public void setDataInizio(LocalDate dataInizio) {this.dataInizio = dataInizio;}
    public LocalDate getDataFine() {return dataFine;}
    public void setDataFine(LocalDate dataFine) {this.dataFine = dataFine;}
    public String getRuolo() {return ruolo;}
    public void setRuolo(String ruolo) {this.ruolo = ruolo;}
    public Dipendente getDipendente() {return dipendente;}
    public void setDipendente(Dipendente dipendente) {this.dipendente = dipendente;}
    public Progetto getProgetto() {return progetto;}
    public void setProgetto(Progetto progetto) {this.progetto = progetto;}
}
