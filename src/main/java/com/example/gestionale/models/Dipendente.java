package com.example.gestionale.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "dipendente")
public class Dipendente implements UserDetails {
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
    @Column(name = "password", nullable = false, length = 255)
    private String password;
    @Column(name = "is_admin", nullable = false)
    private Boolean isAdmin = false;
    @Column(name = "reset_token")
    public String resetToken;
    @Column(name = "reset_token_scadenza")
    public LocalDateTime resetTokenScadenza;

    @OneToMany(mappedBy = "dipendente")
    public List<Assegnato> assegnati;
    @OneToMany(mappedBy = "dipendente")
    public List<Associato> associati;

    public Dipendente(){
    }
    public Dipendente(String nome, String cognome, String email, String area, String password, List<Assegnato> assegnati, List<Associato> associati, Boolean isAdmin) {
        this.nome = nome;
        this.cognome = cognome;
        this.email = email;
        this.area = area;
        this.password = password;
        this.assegnati = assegnati;
        this.associati = associati;
        this.isAdmin = isAdmin;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        String ruolo = Boolean.TRUE.equals(isAdmin) ? "ROLE_ADMIN" : "ROLE_DIPENDENTE";
        return List.of(new SimpleGrantedAuthority(ruolo));
    }

    @Override
    public String getUsername() {return email;}
    @Override
    public boolean isAccountNonExpired() {return true;}
    @Override
    public boolean isAccountNonLocked() {return true;}
    @Override
    public boolean isCredentialsNonExpired() {return true;}
    @Override
    public boolean isEnabled() {return true;}

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
    @Override
    public String getPassword() {return password;}
    public void setPassword(String password) {this.password = password;}
    public List<Assegnato> getAssegnati() {return assegnati;}
    public void setAssegnati(List<Assegnato> assegnati) {this.assegnati = assegnati;}
    public List<Associato> getAssociati() {return associati;}
    public void setAssociati(List<Associato> associati) {this.associati = associati;}
    public Boolean getIsAdmin() {return isAdmin;}
    public void setIsAdmin(Boolean isAdmin) {this.isAdmin = isAdmin != null ? isAdmin : false;}
    public String getResetToken() {return resetToken;}
    public void setResetToken(String resetToken) {this.resetToken = resetToken;}
    public LocalDateTime getResetTokenScadenza() {return resetTokenScadenza;}
    public void setResetTokenScadenza(LocalDateTime resetTokenScadenza) {this.resetTokenScadenza = resetTokenScadenza;}
}
