package com.example.gestionale.dto;

import com.example.gestionale.models.Dipendente;

public class DipendenteRefDTO {
    private Long idDipendente;
    private String nome;
    private String cognome;
    private String area;

    public DipendenteRefDTO(){
    }
    public static DipendenteRefDTO fromEntity(Dipendente dipendente){
        if(dipendente == null) return null;
        DipendenteRefDTO dto = new DipendenteRefDTO();
        dto.idDipendente = dipendente.getIdDipendente();
        dto.nome = dipendente.getNome();
        dto.cognome = dipendente.getCognome();
        dto.area = dipendente.getArea();
        return dto;
    }

    public Long getIdDipendente() {return idDipendente;}
    public void setIdDipendente(Long idDipendente) {this.idDipendente = idDipendente;}
    public String getNome() {return nome;}
    public void setNome(String nome) {this.nome = nome;}
    public String getCognome() {return cognome;}
    public void setCognome(String cognome) {this.cognome = cognome;}
    public String getArea() {return area;}
    public void setArea(String area) {this.area = area;}
}
