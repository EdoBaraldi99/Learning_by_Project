package com.example.gestionale.dto;

import com.example.gestionale.models.Associato;

import java.time.LocalDate;

public class AssociatoResponseDTO {
    private Long idDipendenteAssociatoProgetto;
    private LocalDate dataInizio;
    private LocalDate dataFine;
    private String ruolo;

    private Long idDipendente;
    private String nomeDipendente;
    private String cognomeDipendente;

    private Long idProgetto;
    private String nomeProgetto;

    public AssociatoResponseDTO() {
    }

    public static AssociatoResponseDTO fromEntity(Associato a) {
        AssociatoResponseDTO dto = new AssociatoResponseDTO();
        dto.idDipendenteAssociatoProgetto = a.getIdDipendenteAssociatoProgetto();
        dto.dataInizio = a.getDataInizio();
        dto.dataFine = a.getDataFine();
        dto.ruolo = a.getRuolo();
        if (a.getDipendente() != null) {
            dto.idDipendente = a.getDipendente().getIdDipendente();
            dto.nomeDipendente = a.getDipendente().getNome();
            dto.cognomeDipendente = a.getDipendente().getCognome();
        }
        if (a.getProgetto() != null) {
            dto.idProgetto = a.getProgetto().getIdProgetto();
            dto.nomeProgetto = a.getProgetto().getNome();
        }
        return dto;
    }

    public Long getIdDipendenteAssociatoProgetto() {return idDipendenteAssociatoProgetto;}
    public void setIdDipendenteAssociatoProgetto(Long id) {this.idDipendenteAssociatoProgetto = id;}
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
    public Long getIdProgetto() {return idProgetto;}
    public void setIdProgetto(Long idProgetto) {this.idProgetto = idProgetto;}
    public String getNomeProgetto() {return nomeProgetto;}
    public void setNomeProgetto(String nomeProgetto) {this.nomeProgetto = nomeProgetto;}
}
