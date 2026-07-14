package com.example.gestionale.dto;

import com.example.gestionale.models.Associato;
import com.example.gestionale.models.Attivita;
import com.example.gestionale.models.Progetto;
import java.util.List;

public class ProgettoResponseDTO {
    private Long idProgetto;
    private String nome;
    private String descrizione;
    private String stato;

    private List<AttivitaResponseDTO> attivita;
    private List<AssociatoResponseDTO> associati;

    public ProgettoResponseDTO() {
    }

    public ProgettoResponseDTO(Long idProgetto, String nome, String descrizione, String stato) {
        this.idProgetto = idProgetto;
        this.nome = nome;
        this.descrizione = descrizione;
        this.stato = stato;
    }

    public static ProgettoResponseDTO fromEntity(Progetto p) {
        ProgettoResponseDTO dto = new ProgettoResponseDTO();
        dto.idProgetto = p.getIdProgetto();
        dto.nome = p.getNome();
        dto.descrizione = p.getDescrizione();
        dto.stato = p.getStato();
        if (p.getAttivita() != null) {
            dto.attivita = p.getAttivita().stream().map(AttivitaResponseDTO::fromEntity).toList();
        }
        if (p.getAssociati() != null) {
            dto.associati = p.getAssociati().stream().map(AssociatoResponseDTO::fromEntity).toList();
        }
        return dto;
    }

    public Long getIdProgetto() {return idProgetto;}
    public void setIdProgetto(Long idProgetto) {this.idProgetto = idProgetto;}
    public String getNome() {return nome;}
    public void setNome(String nome) {this.nome = nome;}
    public String getDescrizione() {return descrizione;}
    public void setDescrizione(String descrizione) {this.descrizione = descrizione;}
    public String getStato() {return stato;}
    public void setStato(String stato) {this.stato = stato;}
    public List<AttivitaResponseDTO> getAttivita() {return attivita;}
    public void setAttivita(List<AttivitaResponseDTO> attivita) {this.attivita = attivita;}
    public List<AssociatoResponseDTO> getAssociati() {return associati;}
    public void setAssociati(List<AssociatoResponseDTO> associati) {this.associati = associati;}
}
