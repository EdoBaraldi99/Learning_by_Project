-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Creato il: Lug 17, 2026 alle 15:03
-- Versione del server: 10.4.32-MariaDB
-- Versione PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db_sottointesi`
--

-- --------------------------------------------------------

--
-- Struttura della tabella `dipendente`
--

CREATE TABLE `dipendente` (
  `id_dipendente` bigint(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `cognome` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `area` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `is_admin` bit(1) DEFAULT NULL,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_scadenza` datetime(6) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dump dei dati per la tabella `dipendente`
--

INSERT INTO `dipendente` (`id_dipendente`, `nome`, `cognome`, `email`, `area`, `password`, `is_admin`, `reset_token`, `reset_token_scadenza`) VALUES
(31, 'Giorgio', 'Merco', 'giorgiomerco@email.it', 'Sviluppo', '$2a$10$IcFf3L5xqiwDEP2HRUYV..fO1E1GqGfRf1GmgnQI5udeRz4bnzyfS', b'1', NULL, NULL),
(32, 'Edoardo', 'Dodo', 'dodo@email.its', 'IT', '$2a$10$6hFiWeBX9ib9Iqk6LHfUMeD5R3BfRPDC/cnglqkLUni4JK9YmeN7C', b'0', NULL, NULL),
(33, 'Francois', 'LaBouche', 'labouche@miao.it', 'Design', '$2a$10$65XasECofjW5XuQKdYlawuxhChhdztMlrIej9LCi57jk2WS5to9Y6', b'0', NULL, NULL),
(34, 'Seed', 'Admin', 'seed.admin@gestionale.local', 'Amministrazione', '$2a$10$U.82Hsts3Ti.XHZpKjQmV.VQVvOQ838to9QvCs6E7UdeXoLeMdq7K', b'1', NULL, NULL),
(35, 'Sara', 'Bianchi', 'sara.bianchi@gestionale.local', 'Sviluppo', '$2a$10$tUxbzj/xhVl/WY8x5LY2L.fXr4RxAsVmDxO36KVtse2SpBqp/Naai', b'0', NULL, NULL),
(36, 'Marco', 'Rossi', 'marco.rossi@gestionale.local', 'Design', '$2a$10$..DdYVb7ToAwW3BXoCGQM.AcijZrWRXVX0CZz.IJrtG9AxY40T2ZS', b'0', NULL, NULL),
(37, 'Elena', 'Conti', 'elena.conti@gestionale.local', 'Marketing', '$2a$10$xRpWq6Vgmk3EyxzMoAJxYul.5r1Vm3XOy/KMY18QWTRl5W3jqzuoi', b'0', NULL, NULL),
(38, 'Luca', 'Ferrari', 'luca.ferrari@gestionale.local', 'QA', '$2a$10$Ij.1LrkURJWh4kqZ9Dab9.INODIgpHYenCp/lsoRSE3jlX3.N51cu', b'0', NULL, NULL),
(39, 'Chiara', 'Romano', 'chiara.romano@gestionale.local', 'Sviluppo', '$2a$10$Y1yQZPo1Kt2u7nn.4UunK.9tkBHObjFhQxMX1ltqM/2GMW790GgiS', b'0', NULL, NULL),
(40, 'Davide', 'Greco', 'davide.greco@gestionale.local', 'IT', '$2a$10$AefEy9fV/Ryuik0Wg.WTPOisxIoPAFkU4MofNgAOPqvmXycr7J1SO', b'1', NULL, NULL);

-- --------------------------------------------------------

--
-- Struttura della tabella `dipendente_assegna_task`
--

CREATE TABLE `dipendente_assegna_task` (
  `id_dipendente_assegna_task` bigint(11) NOT NULL,
  `id_dipendente` bigint(11) NOT NULL,
  `id_task` bigint(11) NOT NULL,
  `data_inizio` date NOT NULL,
  `data_fine` date NOT NULL,
  `ruolo` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dump dei dati per la tabella `dipendente_assegna_task`
--

INSERT INTO `dipendente_assegna_task` (`id_dipendente_assegna_task`, `id_dipendente`, `id_task`, `data_inizio`, `data_fine`, `ruolo`) VALUES
(47, 36, 26, '2026-03-01', '2026-03-20', 'Membro'),
(48, 33, 27, '2026-03-15', '2026-04-10', 'Membro'),
(49, 37, 28, '2026-04-01', '2026-04-20', 'Membro'),
(50, 36, 29, '2026-04-15', '2026-04-28', 'Membro'),
(51, 40, 30, '2026-06-15', '2026-07-28', 'Membro'),
(52, 37, 31, '2026-07-05', '2026-08-20', 'Membro'),
(53, 39, 32, '2026-06-20', '2026-07-30', 'Membro'),
(54, 40, 33, '2026-06-25', '2026-07-10', 'Membro'),
(55, 35, 33, '2026-06-25', '2026-07-10', 'Membro'),
(56, 40, 34, '2026-07-15', '2026-08-10', 'Membro'),
(57, 38, 35, '2026-07-20', '2026-09-01', 'Membro');

-- --------------------------------------------------------

--
-- Struttura della tabella `dipendente_associato_progetto`
--

CREATE TABLE `dipendente_associato_progetto` (
  `id_dipendente_associato_progetto` bigint(20) NOT NULL,
  `id_dipendente` bigint(11) NOT NULL,
  `id_progetto` bigint(11) NOT NULL,
  `data_inizio` date NOT NULL,
  `data_fine` date NOT NULL,
  `ruolo` varchar(20) NOT NULL
) ;

--
-- Dump dei dati per la tabella `dipendente_associato_progetto`
--

INSERT INTO `dipendente_associato_progetto` (`id_dipendente_associato_progetto`, `id_dipendente`, `id_progetto`, `data_inizio`, `data_fine`, `ruolo`) VALUES
(39, 31, 13, '2026-07-16', '2099-12-31', 'CapoProgetto'),
(40, 32, 13, '2026-07-16', '2099-12-31', 'Dipendente'),
(41, 33, 13, '2026-07-16', '2099-12-31', 'Dipendente'),
(46, 36, 15, '2026-05-01', '2099-12-31', 'CapoProgetto'),
(47, 33, 15, '2026-05-01', '2099-12-31', 'Dipendente'),
(48, 37, 15, '2026-05-01', '2099-12-31', 'Dipendente'),
(49, 37, 16, '2026-05-01', '2099-12-31', 'CapoProgetto'),
(50, 40, 16, '2026-05-01', '2099-12-31', 'Dipendente'),
(51, 39, 16, '2026-05-01', '2099-12-31', 'Dipendente'),
(52, 35, 16, '2026-05-01', '2099-12-31', 'Dipendente'),
(53, 40, 17, '2026-05-01', '2099-12-31', 'CapoProgetto'),
(54, 32, 17, '2026-05-01', '2099-12-31', 'Dipendente'),
(55, 38, 17, '2026-05-01', '2099-12-31', 'Dipendente');

-- --------------------------------------------------------

--
-- Struttura della tabella `progetto`
--

CREATE TABLE `progetto` (
  `id_progetto` bigint(11) NOT NULL,
  `nome` varchar(50) NOT NULL,
  `descrizione` text DEFAULT NULL,
  `stato` varchar(20) NOT NULL
) ;

--
-- Dump dei dati per la tabella `progetto`
--

INSERT INTO `progetto` (`id_progetto`, `nome`, `descrizione`, `stato`) VALUES
(13, 'Portali Rocky Bikers', 'Negozio digitale di biciclette e accessori per biciclette con una varietà di biciclette e le loro caratteristiche elencate. È inclusa anche la registrazione della manutenzione della bicicletta.', 'in corso'),
(15, 'Redesign Sito Corporate', 'Rifacimento completo del sito istituzionale aziendale: nuovo design, ottimizzazione SEO e migrazione dei contenuti su CMS headless.', 'completato'),
(16, 'Piattaforma E-learning Aziendale', 'Portale interno per l\'erogazione di corsi di formazione obbligatoria e facoltativa ai dipendenti, con tracciamento avanzamento e quiz finali.', 'in corso'),
(17, 'Sistema di Fatturazione Cloud', 'Nuovo modulo di fatturazione elettronica integrato con l\'ERP aziendale, conforme alla normativa SDI.', 'da fare');

-- --------------------------------------------------------

--
-- Struttura della tabella `storico`
--

CREATE TABLE `storico` (
  `id_storico` bigint(20) NOT NULL,
  `data` date DEFAULT NULL,
  `descrizione` text DEFAULT NULL,
  `tempo_lavorato` varchar(20) NOT NULL,
  `id_task` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dump dei dati per la tabella `storico`
--

INSERT INTO `storico` (`id_storico`, `data`, `descrizione`, `tempo_lavorato`, `id_task`) VALUES
(29, '2026-03-05', 'Prima bozza wireframe con nuova hero section.', '5h 0m', 26),
(30, '2026-03-15', 'Revisione con il team marketing e correzioni.', '3h 0m', 26),
(31, '2026-03-20', 'Migrazione pagine istituzionali e blog.', '8h 0m', 27),
(32, '2026-04-02', 'Migrazione schede prodotto e ottimizzazione immagini.', '10h 0m', 27),
(33, '2026-06-20', 'Modellazione dati domande/risposte e punteggio.', '7h 0m', 30),
(34, '2026-06-25', 'Prima versione della dashboard con dati mock.', '4h 30m', 32);

-- --------------------------------------------------------

--
-- Struttura della tabella `task`
--

CREATE TABLE `task` (
  `id_task` bigint(20) NOT NULL,
  `titolo` varchar(50) NOT NULL,
  `descrizione` text DEFAULT NULL,
  `stato` varchar(20) NOT NULL,
  `tipologia` varchar(50) NOT NULL,
  `priorita` varchar(20) NOT NULL,
  `dipendenze` varchar(50) NOT NULL DEFAULT '',
  `scadenza` date NOT NULL,
  `data_assegnazione` date NOT NULL,
  `tempo_stimato` varchar(50) NOT NULL,
  `id_progetto` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dump dei dati per la tabella `task`
--

INSERT INTO `task` (`id_task`, `titolo`, `descrizione`, `stato`, `tipologia`, `priorita`, `dipendenze`, `scadenza`, `data_assegnazione`, `tempo_stimato`, `id_progetto`) VALUES
(26, 'Wireframe nuova homepage', 'Wireframe a bassa fedeltà della nuova homepage con nuova gerarchia dei contenuti.', 'completato', 'Design', 'alta', '', '2026-03-20', '2026-03-01', '10h 0m', 15),
(27, 'Migrazione contenuti su CMS', 'Migrare tutte le pagine testuali e le immagini dal vecchio sito al nuovo CMS headless.', 'completato', 'Sviluppo', 'media', '', '2026-04-10', '2026-03-15', '28h 0m', 15),
(28, 'Audit SEO e redirect 301', 'Audit SEO completo e mappatura dei redirect 301 dalle vecchie URL.', 'completato', 'Marketing', 'media', '', '2026-04-20', '2026-04-01', '14h 0m', 15),
(29, 'Test cross-browser', 'Verifica del rendering su Chrome, Firefox, Safari ed Edge, desktop e mobile.', 'completato', 'Testing', 'bassa', '', '2026-04-28', '2026-04-15', '6h 0m', 15),
(30, 'Modulo quiz e valutazioni', 'Sviluppare il motore di quiz a risposta multipla con punteggio finale e soglia di superamento.', 'in corso', 'Sviluppo', 'alta', '', '2026-07-28', '2026-06-15', '40h 0m', 16),
(31, 'Corso onboarding nuovi assunti', 'Registrare e montare i video del corso di onboarding per i nuovi assunti.', 'da iniziare', 'Documentazione', 'media', '', '2026-08-20', '2026-07-05', '20h 0m', 16),
(32, 'Dashboard avanzamento formazione', 'Dashboard per i responsabili con lo stato di avanzamento dei corsi per ogni dipendente.', 'in corso', 'Sviluppo', 'media', '', '2026-07-30', '2026-06-20', '18h 0m', 16),
(33, 'Integrazione SSO aziendale', 'Collegare il login della piattaforma allo SSO aziendale esistente (Azure AD).', 'bloccato', 'Sviluppo', 'urgente', '', '2026-07-10', '2026-06-25', '16h 0m', 16),
(34, 'Analisi requisiti normativa SDI', 'Raccogliere e documentare i requisiti tecnici imposti dal Sistema di Interscambio.', 'da iniziare', 'Documentazione', 'alta', '', '2026-08-10', '2026-07-15', '12h 0m', 17),
(35, 'Prototipo modulo fatturazione', 'Realizzare un primo prototipo del modulo di emissione fattura elettronica.', 'da iniziare', 'Sviluppo', 'media', '', '2026-09-01', '2026-07-20', '30h 0m', 17);

--
-- Indici per le tabelle scaricate
--

--
-- Indici per le tabelle `dipendente`
--
ALTER TABLE `dipendente`
  ADD PRIMARY KEY (`id_dipendente`);

--
-- Indici per le tabelle `dipendente_assegna_task`
--
ALTER TABLE `dipendente_assegna_task`
  ADD PRIMARY KEY (`id_dipendente_assegna_task`),
  ADD KEY `id_dipendente` (`id_dipendente`),
  ADD KEY `id_task` (`id_task`);

--
-- Indici per le tabelle `dipendente_associato_progetto`
--
ALTER TABLE `dipendente_associato_progetto`
  ADD PRIMARY KEY (`id_dipendente_associato_progetto`),
  ADD KEY `id_dipendente` (`id_dipendente`),
  ADD KEY `id_progetto` (`id_progetto`);

--
-- Indici per le tabelle `progetto`
--
ALTER TABLE `progetto`
  ADD PRIMARY KEY (`id_progetto`);

--
-- Indici per le tabelle `storico`
--
ALTER TABLE `storico`
  ADD PRIMARY KEY (`id_storico`),
  ADD KEY `id_task` (`id_task`);

--
-- Indici per le tabelle `task`
--
ALTER TABLE `task`
  ADD PRIMARY KEY (`id_task`),
  ADD KEY `id_progetto` (`id_progetto`);

--
-- AUTO_INCREMENT per le tabelle scaricate
--

--
-- AUTO_INCREMENT per la tabella `dipendente`
--
ALTER TABLE `dipendente`
  MODIFY `id_dipendente` bigint(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT per la tabella `dipendente_assegna_task`
--
ALTER TABLE `dipendente_assegna_task`
  MODIFY `id_dipendente_assegna_task` bigint(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=58;

--
-- AUTO_INCREMENT per la tabella `dipendente_associato_progetto`
--
ALTER TABLE `dipendente_associato_progetto`
  MODIFY `id_dipendente_associato_progetto` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT per la tabella `progetto`
--
ALTER TABLE `progetto`
  MODIFY `id_progetto` bigint(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT per la tabella `storico`
--
ALTER TABLE `storico`
  MODIFY `id_storico` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT per la tabella `task`
--
ALTER TABLE `task`
  MODIFY `id_task` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- Limiti per le tabelle scaricate
--

--
-- Limiti per la tabella `dipendente_assegna_task`
--
ALTER TABLE `dipendente_assegna_task`
  ADD CONSTRAINT `dipendente_assegna_task_ibfk_1` FOREIGN KEY (`id_dipendente`) REFERENCES `dipendente` (`id_dipendente`),
  ADD CONSTRAINT `dipendente_assegna_task_ibfk_2` FOREIGN KEY (`id_task`) REFERENCES `task` (`id_task`);

--
-- Limiti per la tabella `dipendente_associato_progetto`
--
ALTER TABLE `dipendente_associato_progetto`
  ADD CONSTRAINT `dipendente_associato_progetto_ibfk_1` FOREIGN KEY (`id_dipendente`) REFERENCES `dipendente` (`id_dipendente`),
  ADD CONSTRAINT `dipendente_associato_progetto_ibfk_2` FOREIGN KEY (`id_progetto`) REFERENCES `progetto` (`id_progetto`);

--
-- Limiti per la tabella `storico`
--
ALTER TABLE `storico`
  ADD CONSTRAINT `storico_ibfk_1` FOREIGN KEY (`id_task`) REFERENCES `task` (`id_task`);

--
-- Limiti per la tabella `task`
--
ALTER TABLE `task`
  ADD CONSTRAINT `task_ibfk_1` FOREIGN KEY (`id_progetto`) REFERENCES `progetto` (`id_progetto`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
