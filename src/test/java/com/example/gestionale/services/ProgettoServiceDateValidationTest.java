package com.example.gestionale.services;

import com.example.gestionale.dto.ProgettoRequestDTO;
import com.example.gestionale.models.Progetto;
import com.example.gestionale.repositories.ProgettoRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
class ProgettoServiceDateValidationTest {

    @Autowired
    private ProgettoService progettoService;
    @Autowired
    private ProgettoRepository progettoRepository;

    @Test
    void salvaProgetto_rifiutaDataInizioSuccessivaADataFine() {
        ProgettoRequestDTO dto = new ProgettoRequestDTO("Test", "desc", "in corso");
        dto.setDataInizio(LocalDate.of(2027, 1, 1));
        dto.setDataFine(LocalDate.of(2026, 10, 31));

        assertThatThrownBy(() -> progettoService.salvaProgetto(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("data di inizio");
    }

    @Test
    void salvaProgetto_accettaDataInizioPrecedenteODataFine() {
        ProgettoRequestDTO dto = new ProgettoRequestDTO("Test", "desc", "in corso");
        dto.setDataInizio(LocalDate.of(2026, 1, 1));
        dto.setDataFine(LocalDate.of(2026, 10, 31));

        assertThat(progettoService.salvaProgetto(dto)).isNotNull();
    }

    @Test
    void modificaProgettoPerId_rifiutaDataInizioSuccessivaADataFineEsistente() {
        Progetto esistente = new Progetto();
        esistente.setNome("Esistente");
        esistente.setStato("in corso");
        esistente.setDataInizio(LocalDate.of(2026, 1, 1));
        esistente.setDataFine(LocalDate.of(2026, 6, 30));
        esistente = progettoRepository.save(esistente);

        ProgettoRequestDTO dto = new ProgettoRequestDTO();
        dto.setDataInizio(LocalDate.of(2026, 12, 1)); // dopo la dataFine esistente (2026-06-30), mai aggiornata in questa chiamata

        Long id = esistente.getIdProgetto();
        assertThatThrownBy(() -> progettoService.modificaProgettoPerId(id, dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("data di inizio");
    }

    @Test
    void modificaProgettoPerId_rifiutaQuandoSoloDataFineVieneSpostataPrimaDellInizio() {
        Progetto esistente = new Progetto();
        esistente.setNome("Esistente2");
        esistente.setStato("in corso");
        esistente.setDataInizio(LocalDate.of(2026, 6, 1));
        esistente.setDataFine(LocalDate.of(2026, 12, 31));
        esistente = progettoRepository.save(esistente);

        ProgettoRequestDTO dto = new ProgettoRequestDTO();
        dto.setDataFine(LocalDate.of(2026, 1, 1)); // prima della dataInizio esistente (2026-06-01)

        Long id = esistente.getIdProgetto();
        assertThatThrownBy(() -> progettoService.modificaProgettoPerId(id, dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("data di inizio");
    }
}
