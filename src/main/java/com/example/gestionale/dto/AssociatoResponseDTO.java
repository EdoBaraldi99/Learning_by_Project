package com.example.gestionale.dto;

import com.example.gestionale.models.Associato;

import java.time.LocalDate;

public class AssociatoResponseDTO {
    private Long idDipendenteAssociatoProgetto;
    private LocalDate dataInizio;
    private LocalDate dataFine;
    private String ruolo;

    private DipendenteRefDTO dipendente;
    private ProgettoRefDTO progetto;

    public AssociatoResponseDTO() {
    }

    public static AssociatoResponseDTO fromEntity(Associato a) {
        AssociatoResponseDTO dto = new AssociatoResponseDTO();
        dto.idDipendenteAssociatoProgetto = a.getIdDipendenteAssociatoProgetto();
        dto.dataInizio = a.getDataInizio();
        dto.dataFine = a.getDataFine();
        dto.ruolo = a.getRuolo();
        dto.dipendente = DipendenteRefDTO.fromEntity(a.getDipendente());
        dto.progetto = ProgettoRefDTO.fromEntity(a.getProgetto());
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
    public ProgettoRefDTO getProgetto() {return progetto;}
    public void setProgetto(ProgettoRefDTO progetto) {this.progetto = progetto;}
    public DipendenteRefDTO getDipendente() {return dipendente;}
    public void setDipendente(DipendenteRefDTO dipendente) {this.dipendente = dipendente;}
}
