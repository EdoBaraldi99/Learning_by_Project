package com.example.gestionale.dto;

import com.example.gestionale.models.Attivita;

public class AttivitaRefDTO {
    private Long idTask;
    private String titolo;
    private String tipologia;

    private ProgettoRefDTO progetto;

    public AttivitaRefDTO(){
    }
    public static AttivitaRefDTO fromEntity(Attivita attivita){
        if(attivita == null) return null;
        AttivitaRefDTO dto = new AttivitaRefDTO();
        dto.idTask = attivita.getIdTask();
        dto.titolo = attivita.getTitolo();
        dto.tipologia = attivita.getTipologia();
        dto.progetto = ProgettoRefDTO.fromEntity(attivita.getProgetto());
        return dto;
    }

    public Long getIdTask() {return idTask;}
    public void setIdTask(Long idTask) {this.idTask = idTask;}
    public String getTitolo() {return titolo;}
    public void setTitolo(String titolo) {this.titolo = titolo;}
    public String getTipologia() {return tipologia;}
    public void setTipologia(String tipologia) {this.tipologia = tipologia;}
    public ProgettoRefDTO getProgetto() {return progetto;}
    public void setProgetto(ProgettoRefDTO progetto) {this.progetto = progetto;}
}
