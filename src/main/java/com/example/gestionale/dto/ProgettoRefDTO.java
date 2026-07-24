package com.example.gestionale.dto;

import com.example.gestionale.models.Progetto;

public class ProgettoRefDTO {
    private Long idProgetto;
    private String nome;
    private String stato;

    public ProgettoRefDTO(){
    }
    public static ProgettoRefDTO fromEntity(Progetto progetto){
        if(progetto == null) return null;
        ProgettoRefDTO dto = new ProgettoRefDTO();
        dto.idProgetto = progetto.getIdProgetto();
        dto.nome = progetto.getNome();
        dto.stato = progetto.getStato();
        return dto;
    }

    public Long getIdProgetto() {return idProgetto;}
    public void setIdProgetto(Long idProgetto) {this.idProgetto = idProgetto;}
    public String getNome() {return nome;}
    public void setNome(String nome) {this.nome = nome;}
    public String getStato() {return stato;}
    public void setStato(String stato) {this.stato = stato;}
}
