package com.example.gestionale.dto;

import com.example.gestionale.models.Dipendente;

public class DipendenteRequestDTO {
    private String nome;
    private String cognome;
    private String email;
    private String area;
    private String password; // in chiaro, verrà hashata nel Service

    public DipendenteRequestDTO() {
    }
    public DipendenteRequestDTO(String nome, String cognome, String email, String area, String password) {
        this.nome = nome;
        this.cognome = cognome;
        this.email = email;
        this.area = area;
        this.password = password;
    }

    public Dipendente toEntity() {
        Dipendente d = new Dipendente();
        d.setNome(this.nome);
        d.setCognome(this.cognome);
        d.setEmail(this.email);
        d.setArea(this.area);
        d.setPassword(this.password); // ancora in chiaro qui
        return d;
    }

    public String getNome() {return nome;}
    public void setNome(String nome) {this.nome = nome;}
    public String getCognome() {return cognome;}
    public void setCognome(String cognome) {this.cognome = cognome;}
    public String getEmail() {return email;}
    public void setEmail(String email) {this.email = email;}
    public String getArea() {return area;}
    public void setArea(String area) {this.area = area;}
    public String getPassword() {return password;}
    public void setPassword(String password) {this.password = password;}
}
