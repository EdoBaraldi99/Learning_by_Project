package com.example.gestionale.dto;

import com.example.gestionale.models.Dipendente;

public class LoginResponseDTO {
    private String token;
    private Long idDipendente;
    private String nome;
    private String cognome;
    private String email;
    private String area;
    private Boolean isAdmin;

    public LoginResponseDTO(String token, Dipendente dipendente) {
        this.token = token;
        this.idDipendente = dipendente.getIdDipendente();
        this.nome = dipendente.getNome();
        this.cognome = dipendente.getCognome();
        this.email = dipendente.getEmail();
        this.area = dipendente.getArea();
        this.isAdmin = dipendente.getIsAdmin();
    }

    public String getToken() {return token;}
    public void setToken(String token) {this.token = token;}
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
    public Boolean getIsAdmin() {return isAdmin;}
    public void setIsAdmin(Boolean isAdmin) {this.isAdmin = isAdmin;}
}
