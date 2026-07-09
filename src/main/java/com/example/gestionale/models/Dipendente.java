package com.example.gestionale.models;

import jakarta.persistence.*;

import java.util.List;

@Entity
@Table(name = "dipendente")
public class Dipendente {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long idDipendente;
    @Column(name = "nome", nullable = false, length = 100)
    public String nome;
    @Column(name = "cognome", nullable = false, length = 100)
    public String cognome;
    @Column(name = "email", nullable = false, length = 100)
    public String email;
    @Column(name = "area", nullable = false, length = 50)
    public String area;
    @Column(name = "password", nullable = false, length = 50)
    private String password;

    @OneToMany(mappedBy = "dipendente", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<Assegnato> assegnati;
    @OneToMany(mappedBy = "dipendente", cascade = CascadeType.ALL, orphanRemoval = true)
    public List<Associato> associati;

    public Dipendente(){
    }
    public Dipendente(String nome, String cognome, String email, String area, String password, List<Assegnato> assegnati, List<Associato> associati) {
        this.nome = nome;
        this.cognome = cognome;
        this.email = email;
        this.area = area;
        this.password = password;
        this.assegnati = assegnati;
        this.associati = associati;
    }

    public long getIdDipendente() {return idDipendente;}
    public void setIdDipendente(Long idDipendente) {this.idDipendente = idDipendente;}
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
    public List<Assegnato> getAssegnati() {return assegnati;}
    public void setAssegnati(List<Assegnato> assegnati) {this.assegnati = assegnati;}
    public List<Associato> getAssociati() {return associati;}
    public void setAssociati(List<Associato> associati) {this.associati = associati;}
}
