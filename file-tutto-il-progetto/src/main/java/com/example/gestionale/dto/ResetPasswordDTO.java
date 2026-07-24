package com.example.gestionale.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ResetPasswordDTO {
    @NotBlank(message = "Il token è obbligatorio")
    private String token;
    @NotBlank(message = "La nuova password è obbligatoria")
    @Size(min = 8, message = "La password deve avere almeno 8 caratteri")
    private String nuovaPassword;

    public ResetPasswordDTO() {
    }

    public String getToken() {return token;}
    public void setToken(String token) {this.token = token;}
    public String getNuovaPassword() {return nuovaPassword;}
    public void setNuovaPassword(String nuovaPassword) {this.nuovaPassword = nuovaPassword;}
}
