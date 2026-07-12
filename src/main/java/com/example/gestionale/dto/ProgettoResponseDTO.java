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

    private List<Long> attivitaIds;
    private List<Long> associatiIds;

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
            dto.attivitaIds = p.getAttivita().stream().map(Attivita::getIdTask).toList();
        }
        if (p.getAssociati() != null) {
            dto.associatiIds = p.getAssociati().stream()
                    .map(Associato::getIdDipendenteAssociatoProgetto)
                    .toList();
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
    public List<Long> getAttivitaIds() {return attivitaIds;}
    public void setAttivitaIds(List<Long> attivitaIds) {this.attivitaIds = attivitaIds;}
    public List<Long> getAssociatiIds() {return associatiIds;}
    public void setAssociatiIds(List<Long> associatiIds) {this.associatiIds = associatiIds;}
}
