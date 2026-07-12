package com.example.gestionale.dto;

import com.example.gestionale.models.Assegnato;
import com.example.gestionale.models.Associato;
import com.example.gestionale.models.Dipendente;

import java.util.List;

public class DipendenteResponseDTO {
    private Long idDipendente;
    private String nome;
    private String cognome;
    private String email;
    private String area;
    // niente password

    private List<Long> assegnatiIds;
    private List<Long> associatiIds;

    public DipendenteResponseDTO() {
    }
    public DipendenteResponseDTO(Long idDipendente, String nome, String cognome, String email, String area, List<Long> assegnatiIds, List<Long> associatiIds) {
        this.idDipendente = idDipendente;
        this.nome = nome;
        this.cognome = cognome;
        this.email = email;
        this.area = area;
        this.assegnatiIds = assegnatiIds;
        this.associatiIds = associatiIds;
    }

    public static DipendenteResponseDTO fromEntity(Dipendente d) {
        DipendenteResponseDTO dto = new DipendenteResponseDTO();
        dto.idDipendente = d.getIdDipendente();
        dto.nome = d.getNome();
        dto.cognome = d.getCognome();
        dto.email = d.getEmail();
        dto.area = d.getArea();
        if (d.getAssegnati() != null) {
            dto.assegnatiIds = d.getAssegnati().stream()
                    .map(Assegnato::getIdDipendenteAssegnaTask)
                    .toList();
        }
        if (d.getAssociati() != null) {
            dto.associatiIds = d.getAssociati().stream()
                    .map(Associato::getIdDipendenteAssociatoProgetto)
                    .toList();
        }
        return dto;
    }

    public Long getIdDipendente() {return idDipendente;}
    public void setIdDipendente(Long idDipendente) {this.idDipendente = idDipendente;}
    public String getNome() {return nome;}
    public void setNome(String nome) {this.nome = nome;}
    public String getCognome() {return cognome;}
    public void setCognome(String cognome) {this.cognome = cognome;}
    public String getEmail() {return email;}
    public void setEmail(String email) {this.email = email;}
    public String getArea() {return area;}
    public void setArea(String area) {this.area = area;}
    public List<Long> getAssegnatiIds() {return assegnatiIds;}
    public void setAssegnatiIds(List<Long> assegnatiIds) {this.assegnatiIds = assegnatiIds;}
    public List<Long> getAssociatiIds() {return associatiIds;}
    public void setAssociatiIds(List<Long> associatiIds) {this.associatiIds = associatiIds;}
}
