package com.example.gestionale.dto;

import com.example.gestionale.models.Assegnato;

import java.time.LocalDate;

public class AssegnatoResponseDTO {
    private Long idDipendenteAssegnaTask;
    private LocalDate dataInizio;
    private LocalDate dataFine;
    private String ruolo;

    private Long idDipendente;
    private String nomeDipendente;
    private String cognomeDipendente;

    private Long idAttivita;
    private String titoloAttivita;

    public AssegnatoResponseDTO() {
    }

    public static AssegnatoResponseDTO fromEntity(Assegnato a) {
        AssegnatoResponseDTO dto = new AssegnatoResponseDTO();
        dto.idDipendenteAssegnaTask = a.getIdDipendenteAssegnaTask();
        dto.dataInizio = a.getDataInizioAttivita();
        dto.dataFine = a.getDataFineAttivita();
        dto.ruolo = a.getRuolo();
        if (a.getDipendente() != null) {
            dto.idDipendente = a.getDipendente().getIdDipendente();
            dto.nomeDipendente = a.getDipendente().getNome();
            dto.cognomeDipendente = a.getDipendente().getCognome();
        }
        if (a.getAttivita() != null) {
            dto.idAttivita = a.getAttivita().getIdTask();
            dto.titoloAttivita = a.getAttivita().getTitolo();
        }
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
    public Long getIdDipendente() {return idDipendente;}
    public void setIdDipendente(Long idDipendente) {this.idDipendente = idDipendente;}
    public String getNomeDipendente() {return nomeDipendente;}
    public void setNomeDipendente(String nomeDipendente) {this.nomeDipendente = nomeDipendente;}
    public String getCognomeDipendente() {return cognomeDipendente;}
    public void setCognomeDipendente(String cognomeDipendente) {this.cognomeDipendente = cognomeDipendente;}
    public Long getIdAttivita() {return idAttivita;}
    public void setIdAttivita(Long idAttivita) {this.idAttivita = idAttivita;}
    public String getTitoloAttivita() {return titoloAttivita;}
    public void setTitoloAttivita(String titoloAttivita) {this.titoloAttivita = titoloAttivita;}
}
