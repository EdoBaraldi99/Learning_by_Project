package com.example.gestionale.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class RichiestaResetPasswordDTO {
    @NotBlank(message = "L'email è obbligatoria")
    @Email(message = "Formato email non valido")
    private String email;

    public RichiestaResetPasswordDTO() {
    }

    public String getEmail() {return email;}
    public void setEmail(String email) {this.email = email;}
}
