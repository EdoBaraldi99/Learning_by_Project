package com.example.gestionale.dto;

import com.example.gestionale.models.Dipendente;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class DipendenteRequestDTO {
    @NotBlank(message = "Il nome è obbligatorio")
    private String nome;
    @NotBlank(message = "Il cognome è obbligatorio")
    private String cognome;
    @NotBlank(message = "L'email è obbligatoria")
    @Email(message = "Formato email non valido")
    private String email;
    @NotBlank(message = "L'area è obbligatoria")
    private String area;
    // Nessuna validazione qui: obbligatoria solo in creazione (min. 8 caratteri,
    // controllato manualmente in DipendenteService.salvaDipendente), assente in
    // modifica — @NotBlank/@Size romperebbero l'aggiornamento parziale via PATCH,
    // che non invia mai la password.
    private String password;// in chiaro, verrà hashata nel Service

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
