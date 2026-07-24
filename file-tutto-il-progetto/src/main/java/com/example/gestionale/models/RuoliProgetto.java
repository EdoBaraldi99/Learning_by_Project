package com.example.gestionale.models;

public class RuoliProgetto {
    // Valori allineati a quelli usati dal frontend per Associato.ruolo
    // (progetti.js / progetti-dettaglio.js), non modificabili senza rompere
    // il confronto in ProgettoAuthService.isCapoProgetto.
    public static final String TEAM_LEADER = "CapoProgetto";
    public static final String MEMBRO = "Dipendente";

    private RuoliProgetto() {}
}
