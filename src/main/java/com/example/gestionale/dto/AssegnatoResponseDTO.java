package com.example.gestionale.dto;

import com.example.gestionale.models.Assegnato;

import java.time.LocalDate;

public class AssegnatoResponseDTO {
    private Long idDipendenteAssegnaTask;
    private LocalDate dataInizio;
    private LocalDate dataFine;
    private String ruolo;

    private DipendenteRefDTO dipendente;
    private AttivitaRefDTO attivita;

    public AssegnatoResponseDTO() {
    }

    public static AssegnatoResponseDTO fromEntity(Assegnato a) {
        AssegnatoResponseDTO dto = new AssegnatoResponseDTO();
        dto.idDipendenteAssegnaTask = a.getIdDipendenteAssegnaTask();
        dto.dataInizio = a.getDataInizioAttivita();
        dto.dataFine = a.getDataFineAttivita();
        dto.ruolo = a.getRuolo();
        dto.dipendente = DipendenteRefDTO.fromEntity(a.getDipendente());
        dto.attivita = AttivitaRefDTO.fromEntity(a.getAttivita());
        return dto;
    }

    public Long getIdDipendenteAssegnaTask() {return idDipendenteAssegnaTask;}
    public void setIdDipendenteAssegnaTask(Long id) {this.idDipendenteAssegnaTask = id;}
    public LocalDate getDataInizio() {return dataInizio;}
    public void setDataInizio(LocalDate dataInizio) {this.dataInizio = dataInizio;}
    public LocalDate getDataFine() {return dataFine;}
    public void setDataFine(LocalDate dataFine) {this.dataFine = dataFine;}
    public String getRuolo() {return ruolo;}
    public void setRuolo(String ruolo) {this.ruolo = ruolo;}
    public DipendenteRefDTO getDipendente() {return dipendente;}
    public void setDipendente(DipendenteRefDTO dipendente) {this.dipendente = dipendente;}
    public AttivitaRefDTO getAttivita() {return attivita;}
    public void setAttivita(AttivitaRefDTO attivita) {this.attivita = attivita;}
}
