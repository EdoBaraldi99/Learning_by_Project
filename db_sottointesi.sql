-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Creato il: Lug 21, 2026 alle 15:21
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
(35, 'Sara', 'Bianchi', 'sara.bianchi@gestionale.local', 'Sviluppo Full-Stack', '$2a$10$U3XbckQo1J9CRGj7r7//luWuWHFicxhOmyZYrALN67dzVeVEoLFdu', b'0', NULL, NULL),
(36, 'Marco', 'Rossi', 'marco.rossi@gestionale.local', 'Design', '$2a$10$..DdYVb7ToAwW3BXoCGQM.AcijZrWRXVX0CZz.IJrtG9AxY40T2ZS', b'0', NULL, NULL),
(37, 'Elena', 'Conti', 'elena.conti@gestionale.local', 'Marketing', '$2a$10$xRpWq6Vgmk3EyxzMoAJxYul.5r1Vm3XOy/KMY18QWTRl5W3jqzuoi', b'0', NULL, NULL),
(38, 'Luca', 'Ferrari', 'luca.ferrari@gestionale.local', 'QA', '$2a$10$Ij.1LrkURJWh4kqZ9Dab9.INODIgpHYenCp/lsoRSE3jlX3.N51cu', b'0', NULL, NULL),
(39, 'Chiara', 'Romano', 'chiara.romano@gestionale.local', 'Sviluppo', '$2a$10$FhKPBnchXsljvgSeT/.o0OeASr9hzVPGAyLKVZdHgl0ESrDzkBqPK', b'0', NULL, NULL),
(40, 'Davide', 'Greco', 'davide.greco@gestionale.local', 'IT', '$2a$10$AefEy9fV/Ryuik0Wg.WTPOisxIoPAFkU4MofNgAOPqvmXycr7J1SO', b'1', NULL, NULL),
(41, 'Ethan', '', 'ethan.stuani@edu-its.it', 'IT', '$2a$10$dsL0XCxGrlUNnSW2lOP/bOMf/3zz4Kcta/VKMBqQrM6XLKYOCYqpu', b'0', NULL, NULL),
(42, 'Federica', 'Bruno', 'federica.bruno@gestionale.local', 'Sviluppo Backend', '$2a$10$6fvrUx5utw48svUMVIvs1.IU.rJy2rsbmiQi74GtZogZroxYkcmRK', b'0', NULL, NULL),
(43, 'Simone', 'Ricci', 'simone.ricci@gestionale.local', 'Frontend', '$2a$10$g3TJro13LX7bUEdmLBcQIOzCWdJVj88G6Ju0PF2kKwgR.ry6VfSIW', b'0', NULL, NULL),
(44, 'Valentina', 'Esposito', 'valentina.esposito@gestionale.local', 'UX/UI Design', '$2a$10$YAKs7IXMy0.PLEiWqp6gjeKtRZUB4pTAP6pPr45pRkNzodBppFuV.', b'0', NULL, NULL),
(45, 'Andrea', 'Colombo', 'andrea.colombo@gestionale.local', 'DevOps', '$2a$10$RphV2XIGMNVrAEH7zPg9EOkdKh.0uHowFmw3yCB8HzHfb.1qxYfJK', b'0', NULL, NULL),
(46, 'Giulia', 'Marino', 'giulia.marino@gestionale.local', 'QA & Testing', '$2a$10$1D4HAWTA34Qm8sJqCTDl8u3Mtf5njYqFmXxHyNakbjLzdwDiaxPfu', b'0', NULL, NULL),
(47, 'Matteo', 'Villa', 'matteo.villa@gestionale.local', 'Data Engineering', '$2a$10$/Pk4sbw2fiJhfC14hcz9UeCY6NKzroBSzZpwB4b4RZgXUHq9dWJeO', b'0', NULL, NULL),
(48, 'Alessia', 'Gallo', 'alessia.gallo@gestionale.local', 'Marketing Digitale', '$2a$10$twJ9Td7eAqzYFVCEn/AY7e7uuJATGwmPLVJgefAcwXNI1mESnKjVG', b'0', NULL, NULL),
(49, 'Riccardo', 'Fontana', 'riccardo.fontana@gestionale.local', 'Vendite', '$2a$10$5iSa2e3gKLbsHZsVvqPb2O16iMp.vWTPcls7H8/qP4c4zIEu9DgS.', b'0', NULL, NULL),
(50, 'Martina', 'Barbieri', 'martina.barbieri@gestionale.local', 'Risorse Umane', '$2a$10$1r9S.nztzcv1THLYI/g0o.Hkz0Z7lZeLCe3Kr05GF0bOCDBc2QzR6', b'0', NULL, NULL),
(51, 'Lorenzo', 'Rinaldi', 'lorenzo.rinaldi@gestionale.local', 'Amministrazione', '$2a$10$lKQusIQ3m2IgBHKrg7OIdOm5yZZBckyIOIyEei8USfxGNAGSKASWy', b'0', NULL, NULL),
(52, 'Sofia', 'Caruso', 'sofia.caruso@gestionale.local', 'Customer Success', '$2a$10$8rj.7A8c7F85MvZpf41cAe2ikp8.t8CjiciVWmIpZrQuU.0KNeimi', b'0', NULL, NULL),
(53, 'Tommaso', 'Longo', 'tommaso.longo@gestionale.local', 'Sicurezza Informatica', '$2a$10$EG9C5afb7M/bcdyFLeiB2eCHQ.KJmNZJgF9FT/3BaO0oQIbLhqt6W', b'0', NULL, NULL),
(54, 'Beatrice', 'Mancini', 'beatrice.mancini@gestionale.local', 'Project Management', '$2a$10$Q9wg.cNrTmWBNrmYOg87EuvlJVt0ssIII2.UesITmdX4gZwtZ/yCq', b'0', NULL, NULL),
(55, 'Nicola', 'Bianco', 'nicola.bianco@gestionale.local', 'Infrastruttura Cloud', '$2a$10$tHehQaDutcPnPaMqoxp0Sux5cDC9pVHau5i0YTHQWfdWFwTXmDY9a', b'0', NULL, NULL),
(56, 'Chiara', 'Serra', 'chiara.serra@gestionale.local', 'Business Analysis', '$2a$10$6uipyxkVApaDvoS26yJvXuCxiWwPwURAR1P7JuB9YwgiSGT8WfJRS', b'0', NULL, NULL),
(59, 'Seed', 'Admin', 'seed.admin@gestionale.local', 'Amministrazione', '$2a$10$vkyWHo57i9aAe.yNTjqfOOtK1W2/f8sewl7Cps.yMQUPJ6o5dr8qO', b'1', NULL, NULL);

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
(128, 36, 75, '2026-03-01', '2026-03-20', 'Membro'),
(129, 33, 76, '2026-03-15', '2026-04-10', 'Membro'),
(130, 37, 77, '2026-04-01', '2026-04-20', 'Membro'),
(131, 36, 78, '2026-04-15', '2026-04-28', 'Membro'),
(132, 37, 79, '2026-07-05', '2026-08-20', 'Membro'),
(133, 40, 80, '2026-06-25', '2026-07-10', 'Membro'),
(134, 35, 80, '2026-06-25', '2026-07-10', 'Membro'),
(135, 42, 81, '2026-07-21', '2026-03-20', 'Membro'),
(136, 43, 81, '2026-07-21', '2026-03-20', 'Membro'),
(137, 47, 82, '2026-07-20', '2099-12-31', 'Membro'),
(138, 42, 82, '2026-07-20', '2099-12-31', 'Membro'),
(139, 45, 83, '2026-07-20', '2099-12-31', 'Membro'),
(140, 46, 83, '2026-07-20', '2099-12-31', 'Membro'),
(141, 49, 84, '2026-07-20', '2099-12-31', 'Membro'),
(142, 45, 84, '2026-07-20', '2099-12-31', 'Membro'),
(143, 47, 85, '2026-07-20', '2099-12-31', 'Membro'),
(144, 42, 85, '2026-07-20', '2099-12-31', 'Membro'),
(145, 56, 86, '2026-07-20', '2099-12-31', 'Membro'),
(146, 54, 86, '2026-07-20', '2099-12-31', 'Membro'),
(147, 54, 87, '2026-07-20', '2099-12-31', 'Membro'),
(148, 47, 87, '2026-07-20', '2099-12-31', 'Membro'),
(149, 55, 88, '2026-07-20', '2099-12-31', 'Membro'),
(150, 45, 88, '2026-07-20', '2099-12-31', 'Membro'),
(151, 45, 89, '2026-07-20', '2099-12-31', 'Membro'),
(152, 53, 89, '2026-07-20', '2099-12-31', 'Membro'),
(153, 51, 90, '2026-07-20', '2099-12-31', 'Membro'),
(154, 55, 90, '2026-07-20', '2099-12-31', 'Membro'),
(155, 54, 91, '2026-07-20', '2099-12-31', 'Membro'),
(156, 43, 91, '2026-07-20', '2099-12-31', 'Membro'),
(157, 43, 92, '2026-07-20', '2099-12-31', 'Membro'),
(158, 44, 92, '2026-07-20', '2099-12-31', 'Membro'),
(159, 44, 93, '2026-07-20', '2099-12-31', 'Membro'),
(160, 52, 93, '2026-07-20', '2099-12-31', 'Membro'),
(161, 52, 94, '2026-07-20', '2099-12-31', 'Membro'),
(162, 54, 94, '2026-07-20', '2099-12-31', 'Membro'),
(163, 53, 95, '2026-07-20', '2099-12-31', 'Membro'),
(164, 55, 95, '2026-07-20', '2099-12-31', 'Membro'),
(165, 56, 96, '2026-07-20', '2099-12-31', 'Membro'),
(166, 53, 96, '2026-07-20', '2099-12-31', 'Membro'),
(167, 56, 97, '2026-07-20', '2099-12-31', 'Membro'),
(168, 48, 97, '2026-07-20', '2099-12-31', 'Membro'),
(169, 52, 98, '2026-07-20', '2099-12-31', 'Membro'),
(170, 56, 98, '2026-07-20', '2099-12-31', 'Membro'),
(171, 51, 99, '2026-07-20', '2099-12-31', 'Membro'),
(172, 50, 99, '2026-07-20', '2099-12-31', 'Membro'),
(173, 50, 100, '2026-07-20', '2099-12-31', 'Membro'),
(174, 48, 100, '2026-07-20', '2099-12-31', 'Membro'),
(175, 48, 101, '2026-07-20', '2099-12-31', 'Membro'),
(176, 54, 101, '2026-07-20', '2099-12-31', 'Membro'),
(177, 54, 102, '2026-07-20', '2099-12-31', 'Membro'),
(178, 51, 102, '2026-07-20', '2099-12-31', 'Membro');

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
(105, 36, 33, '2026-07-20', '2099-12-31', 'CapoProgetto'),
(106, 33, 33, '2026-07-20', '2099-12-31', 'Dipendente'),
(107, 37, 33, '2026-07-20', '2099-12-31', 'Dipendente'),
(108, 41, 34, '2026-07-21', '2099-12-31', 'CapoProgetto'),
(109, 35, 34, '2026-07-21', '2099-12-31', 'Dipendente'),
(110, 37, 34, '2026-07-21', '2099-12-31', 'Dipendente'),
(111, 38, 34, '2026-07-21', '2099-12-31', 'Dipendente'),
(112, 39, 34, '2026-07-21', '2099-12-31', 'Dipendente'),
(113, 40, 34, '2026-07-21', '2099-12-31', 'Dipendente'),
(114, 44, 34, '2026-07-21', '2099-12-31', 'Dipendente'),
(115, 42, 35, '2026-03-01', '2099-12-31', 'CapoProgetto'),
(116, 43, 35, '2026-03-01', '2099-12-31', 'Dipendente'),
(117, 44, 35, '2026-03-01', '2099-12-31', 'Dipendente'),
(118, 47, 35, '2026-03-01', '2099-12-31', 'Dipendente'),
(119, 45, 36, '2026-02-10', '2099-12-31', 'CapoProgetto'),
(120, 46, 36, '2026-02-10', '2099-12-31', 'Dipendente'),
(121, 55, 36, '2026-02-10', '2099-12-31', 'Dipendente'),
(122, 49, 36, '2026-02-10', '2099-12-31', 'Dipendente'),
(123, 47, 37, '2026-04-15', '2099-12-31', 'CapoProgetto'),
(124, 42, 37, '2026-04-15', '2099-12-31', 'Dipendente'),
(125, 56, 37, '2026-04-15', '2099-12-31', 'Dipendente'),
(126, 54, 37, '2026-04-15', '2099-12-31', 'Dipendente'),
(127, 55, 38, '2026-01-20', '2099-12-31', 'CapoProgetto'),
(128, 45, 38, '2026-01-20', '2099-12-31', 'Dipendente'),
(129, 53, 38, '2026-01-20', '2099-12-31', 'Dipendente'),
(130, 51, 38, '2026-01-20', '2099-12-31', 'Dipendente'),
(131, 54, 39, '2026-08-01', '2099-12-31', 'CapoProgetto'),
(132, 43, 39, '2026-08-01', '2099-12-31', 'Dipendente'),
(133, 44, 39, '2026-08-01', '2099-12-31', 'Dipendente'),
(134, 52, 39, '2026-08-01', '2099-12-31', 'Dipendente'),
(135, 53, 40, '2026-05-01', '2099-12-31', 'CapoProgetto'),
(136, 55, 40, '2026-05-01', '2099-12-31', 'Dipendente'),
(137, 50, 40, '2026-05-01', '2099-12-31', 'Dipendente'),
(138, 56, 40, '2026-05-01', '2099-12-31', 'Dipendente'),
(139, 56, 41, '2026-03-15', '2099-12-31', 'CapoProgetto'),
(140, 48, 41, '2026-03-15', '2099-12-31', 'Dipendente'),
(141, 49, 41, '2026-03-15', '2099-12-31', 'Dipendente'),
(142, 52, 41, '2026-03-15', '2099-12-31', 'Dipendente'),
(156, 56, 42, '2026-07-21', '2099-12-31', 'CapoProgetto'),
(157, 48, 42, '2026-07-21', '2099-12-31', 'Dipendente'),
(158, 50, 42, '2026-07-21', '2099-12-31', 'Dipendente'),
(159, 51, 42, '2026-07-21', '2099-12-31', 'Dipendente'),
(160, 54, 42, '2026-07-21', '2099-12-31', 'Dipendente');

-- --------------------------------------------------------

--
-- Struttura della tabella `progetto`
--

CREATE TABLE `progetto` (
  `id_progetto` bigint(11) NOT NULL,
  `nome` varchar(50) NOT NULL,
  `descrizione` text DEFAULT NULL,
  `stato` varchar(20) NOT NULL,
  `data_fine` date DEFAULT NULL,
  `data_inizio` date DEFAULT NULL,
  `data_creazione` datetime(6) DEFAULT NULL,
  `data_aggiornamento` datetime(6) DEFAULT NULL
) ;

--
-- Dump dei dati per la tabella `progetto`
--

INSERT INTO `progetto` (`id_progetto`, `nome`, `descrizione`, `stato`, `data_fine`, `data_inizio`, `data_creazione`, `data_aggiornamento`) VALUES
(33, 'Redesign Sito Corporate', 'Rifacimento completo del sito istituzionale aziendale: nuovo design, ottimizzazione SEO e migrazione dei contenuti su CMS headless.', 'completato', '2026-06-30', '2026-01-15', '2026-01-07 00:00:00.000000', '2026-06-25 00:00:00.000000'),
(34, 'Piattaforma E-learning Aziendale', 'Portale interno per l\'erogazione di corsi di formazione obbligatoria e facoltativa ai dipendenti, con tracciamento avanzamento e quiz finali.', 'in corso', '2026-08-22', '2026-07-14', '2026-07-05 00:00:00.000000', '2026-07-09 00:00:00.000000'),
(35, 'Portale Prenotazioni Sanitarie', 'Portale web per la prenotazione di visite mediche ed esami diagnostici, con gestione agende multi-struttura e promemoria automatici via email.', 'in corso', '2026-09-30', '2026-03-01', '2026-02-19 00:00:00.000000', '2026-07-08 00:00:00.000000'),
(36, 'App Mobile Logistica Smart', 'Applicazione mobile per autisti e magazzinieri con tracciamento spedizioni in tempo reale, scansione barcode e ottimizzazione dei percorsi di consegna.', 'in corso', '2026-10-31', '2026-02-10', '2026-01-30 00:00:00.000000', '2026-07-19 00:00:00.000000'),
(37, 'Sistema di Raccomandazione AI', 'Motore di raccomandazione basato su machine learning per suggerire prodotti personalizzati agli utenti dell\'e-commerce aziendale.', 'in corso', '2026-12-15', '2026-04-15', '2026-04-03 00:00:00.000000', '2026-07-18 00:00:00.000000'),
(38, 'Migrazione Infrastruttura Cloud Ibrida', 'Migrazione dei carichi di lavoro on-premise verso un\'architettura cloud ibrida, con failover automatico e ottimizzazione dei costi.', 'in corso', '2026-08-31', '2026-01-20', '2026-01-07 00:00:00.000000', '2026-07-17 00:00:00.000000'),
(39, 'Piattaforma Marketplace B2B', 'Marketplace digitale per la compravendita all\'ingrosso tra aziende, con gestione cataloghi, contrattazione prezzi e fatturazione integrata.', 'da fare', '2027-03-31', '2026-08-01', '2026-07-07 00:00:00.000000', '2026-07-07 00:00:00.000000'),
(40, 'Revisione Sicurezza Perimetrale', 'Verifica e rafforzamento delle difese di rete aziendali, comprensiva di penetration test e aggiornamento delle policy di accesso.', 'in corso', '2026-08-31', '2026-05-01', '2026-04-24 00:00:00.000000', '2026-07-15 00:00:00.000000'),
(41, 'CRM Nuova Generazione', 'Sviluppo di un nuovo sistema di gestione delle relazioni con i clienti, con automazione delle campagne e reportistica avanzata sulle vendite.', 'in corso', '2026-11-30', '2026-03-15', '2026-03-07 00:00:00.000000', '2026-07-14 00:00:00.000000'),
(42, 'Programma Sostenibilità Aziendale', 'Iniziativa interna per ridurre l\'impatto ambientale dell\'azienda, con monitoraggio dei consumi energetici e piano di riduzione delle emissioni.', 'da fare', '2027-06-30', '2026-09-01', '2026-07-12 00:00:00.000000', '2026-07-12 00:00:00.000000');

-- --------------------------------------------------------

--
-- Struttura della tabella `storico`
--

CREATE TABLE `storico` (
  `id_storico` bigint(20) NOT NULL,
  `data` date DEFAULT NULL,
  `descrizione` text DEFAULT NULL,
  `tempo_lavorato` varchar(20) NOT NULL,
  `id_task` bigint(20) NOT NULL,
  `id_dipendente` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dump dei dati per la tabella `storico`
--

INSERT INTO `storico` (`id_storico`, `data`, `descrizione`, `tempo_lavorato`, `id_task`, `id_dipendente`) VALUES
(64, '2026-03-05', 'Verifica admin override', '5h 0m', 75, 59),
(65, '2026-03-15', 'Revisione con il team marketing e correzioni.', '3h 0m', 75, 59),
(66, '2026-03-20', 'Migrazione pagine istituzionali e blog.', '8h 0m', 76, 59),
(67, '2026-04-02', 'Migrazione schede prodotto e ottimizzazione immagini.', '10h 0m', 76, 59),
(68, '2026-07-15', 'Voce MODIFICATA con successo', '5h 30m', 80, 59),
(69, '2026-07-20', 'Voce modificata dal proprietario', '1h 0m', 80, 59),
(70, '2026-07-20', 'Modifica da admin', '1h 0m', 80, 59),
(71, '2026-07-20', 'Modifica da admin', '1h 0m', 80, 59),
(72, '2026-06-10', 'Avanzamento su \"Progettazione schema database prenotazioni\": completate le attività pianificate per la giornata, nessun blocco riscontrato.', '2h 0m', 81, 42),
(73, '2026-06-25', 'Lavorato su \"Progettazione schema database prenotazioni\": risolti alcuni dubbi emersi durante l\'implementazione, allineamento con il team previsto domani.', '3h 15m', 81, 43),
(74, '2026-06-10', 'Proseguita l\'attività \"Sviluppo modulo scansione barcode\": test preliminari eseguiti con esito positivo, resta da rifinire un dettaglio minore.', '5h 45m', 83, 45),
(75, '2026-06-25', 'Dedicato tempo a \"Sviluppo modulo scansione barcode\": confronto con un collega per allineare l\'approccio prima di procedere.', '2h 0m', 83, 46),
(76, '2026-06-10', 'Sessione di lavoro su \"Raccolta e pulizia dataset comportamento utenti\": rivista la documentazione tecnica e aggiornato lo stato di avanzamento.', '5h 45m', 85, 47),
(77, '2026-06-25', 'Proseguita l\'attività \"Raccolta e pulizia dataset comportamento utenti\": test preliminari eseguiti con esito positivo, resta da rifinire un dettaglio minore.', '2h 0m', 85, 42),
(78, '2026-06-10', 'Avanzamento su \"Censimento carichi di lavoro esistenti\": completate le attività pianificate per la giornata, nessun blocco riscontrato.', '4h 30m', 88, 55),
(79, '2026-06-25', 'Lavorato su \"Censimento carichi di lavoro esistenti\": risolti alcuni dubbi emersi durante l\'implementazione, allineamento con il team previsto domani.', '5h 45m', 88, 45),
(80, '2026-06-10', 'Sessione di lavoro su \"Configurazione rete virtuale ibrida\": rivista la documentazione tecnica e aggiornato lo stato di avanzamento.', '2h 0m', 89, 45),
(81, '2026-06-25', 'Proseguita l\'attività \"Configurazione rete virtuale ibrida\": test preliminari eseguiti con esito positivo, resta da rifinire un dettaglio minore.', '3h 15m', 89, 53),
(82, '2026-06-10', 'Avanzamento su \"Esecuzione penetration test esterno\": completate le attività pianificate per la giornata, nessun blocco riscontrato.', '5h 45m', 95, 53),
(83, '2026-06-25', 'Lavorato su \"Esecuzione penetration test esterno\": risolti alcuni dubbi emersi durante l\'implementazione, allineamento con il team previsto domani.', '2h 0m', 95, 55),
(84, '2026-06-10', 'Dedicato tempo a \"Migrazione anagrafiche clienti storiche\": confronto con un collega per allineare l\'approccio prima di procedere.', '5h 45m', 97, 56),
(85, '2026-06-25', 'Avanzamento su \"Migrazione anagrafiche clienti storiche\": completate le attività pianificate per la giornata, nessun blocco riscontrato.', '2h 0m', 97, 48);

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
(75, 'Wireframe nuova homepage', 'Wireframe a bassa fedeltà della nuova homepage con nuova gerarchia dei contenuti.', 'completato', 'Design', 'alta', '', '2026-03-20', '2026-03-01', '10h 0m', 33),
(76, 'Migrazione contenuti su CMS', 'Migrare tutte le pagine testuali e le immagini dal vecchio sito al nuovo CMS headless.', 'completato', 'Sviluppo', 'media', '', '2026-04-10', '2026-03-15', '28h 0m', 33),
(77, 'Audit SEO e redirect 301', 'Audit SEO completo e mappatura dei redirect 301 dalle vecchie URL.', 'completato', 'Marketing', 'media', '', '2026-04-20', '2026-04-01', '14h 0m', 33),
(78, 'Test cross-browser', 'Verifica del rendering su Chrome, Firefox, Safari ed Edge, desktop e mobile.', 'completato', 'Testing', 'bassa', '', '2026-04-28', '2026-04-15', '6h 0m', 33),
(79, 'Corso onboarding nuovi assunti', 'Registrare e montare i video del corso di onboarding per i nuovi assunti.', 'completato', 'Documentazione', 'media', '', '2026-08-20', '2026-07-05', '20h 0m', 34),
(80, 'Integrazione SSO aziendale', 'Collegare il login della piattaforma allo SSO aziendale esistente (Azure AD).', 'completato', 'Sviluppo', 'urgente', '', '2026-07-10', '2026-06-25', '16h 0m', 34),
(81, 'Progettazione schema database prenotazioni', 'Modellazione delle tabelle per pazienti, medici, agende e slot di disponibilità.', 'completato', 'backend', 'alta', '', '2026-03-20', '2026-03-01', '12h 0m', 35),
(82, 'Test di carico sistema prenotazioni', 'Simulazione di picchi di accesso concorrente per validare i tempi di risposta dell\'agenda.', 'da iniziare', 'Testing', 'Media', '', '2026-09-15', '2026-03-01', '6h 0m', 35),
(83, 'Sviluppo modulo scansione barcode', 'Integrazione della fotocamera per la lettura di barcode e QR code sui colli in uscita.', 'completato', 'Sviluppo', 'Alta', '', '2026-04-01', '2026-02-10', '16h 0m', 36),
(84, 'Collaudo app su dispositivi Android e iOS', 'Verifica del funzionamento su diversi modelli e versioni di sistema operativo.', 'da iniziare', 'Testing', 'Bassa', '', '2026-10-10', '2026-02-10', '10h 0m', 36),
(85, 'Raccolta e pulizia dataset comportamento utenti', 'Estrazione e normalizzazione dei log di navigazione e acquisto degli ultimi due anni.', 'completato', 'Analisi', 'Alta', '', '2026-05-20', '2026-04-15', '22h 0m', 37),
(86, 'Valutazione metriche di accuratezza modello', 'Calcolo di precision, recall e NDCG su un set di test isolato per validare la qualità dei suggerimenti.', 'da iniziare', 'Testing', 'Media', '', '2026-10-01', '2026-04-15', '10h 0m', 37),
(87, 'Deploy modello in ambiente di produzione', 'Esposizione del modello come microservizio con monitoraggio delle performance in produzione.', 'da iniziare', 'DevOps', 'Media', '', '2026-11-15', '2026-04-15', '14h 0m', 37),
(88, 'Censimento carichi di lavoro esistenti', 'Mappatura di tutti i server e servizi on-premise da migrare, con relative dipendenze.', 'completato', 'Analisi', 'Alta', '', '2026-02-15', '2026-01-20', '12h 0m', 38),
(89, 'Configurazione rete virtuale ibrida', 'Creazione di VPN site-to-site e subnet dedicate tra data center aziendale e provider cloud.', 'completato', 'DevOps', 'Alta', '', '2026-04-01', '2026-01-20', '16h 0m', 38),
(90, 'Verifica failover e disaster recovery', 'Simulazione di guasto del sito primario per validare i tempi di failover verso il cloud.', 'da iniziare', 'Testing', 'Media', '', '2026-08-25', '2026-01-20', '8h 0m', 38),
(91, 'Progettazione cataloghi prodotti multi-fornitore', 'Definizione della struttura dati per cataloghi con varianti, listini e disponibilità per fornitore.', 'da iniziare', 'Analisi', 'Alta', '', '2026-09-01', '2026-08-01', '14h 0m', 39),
(92, 'Sviluppo motore di contrattazione prezzi', 'Funzionalità di negoziazione prezzo tra acquirente e venditore con storico delle proposte.', 'da iniziare', 'Backend', 'Media', '', '2026-11-01', '2026-08-01', '26h 0m', 39),
(93, 'Integrazione fatturazione elettronica', 'Generazione automatica di fatture elettroniche conformi allo standard SDI per ogni ordine concluso.', 'da iniziare', 'Backend', 'Media', '', '2027-01-15', '2026-08-01', '18h 0m', 39),
(94, 'Test di sicurezza pagamenti B2B', 'Penetration test mirato sul flusso di pagamento e sulla gestione delle credenziali aziendali.', 'da iniziare', 'Sicurezza', 'Alta', '', '2027-03-01', '2026-08-01', '12h 0m', 39),
(95, 'Esecuzione penetration test esterno', 'Test di intrusione sui sistemi esposti su internet con report dettagliato delle vulnerabilità trovate.', 'completato', 'Sicurezza', 'Urgente', '', '2026-06-01', '2026-05-01', '20h 0m', 40),
(96, 'Formazione dipendenti su phishing', 'Sessione formativa aziendale con simulazione di attacco phishing per misurare la consapevolezza del personale.', 'da iniziare', 'Sicurezza', 'Media', '', '2026-08-28', '2026-05-01', '4h 0m', 40),
(97, 'Migrazione anagrafiche clienti storiche', 'Importazione e bonifica dei dati clienti dal vecchio gestionale al nuovo CRM.', 'completato', 'Backend', 'Alta', '', '2026-05-01', '2026-03-15', '16h 0m', 41),
(98, 'Formazione team commerciale su nuovo CRM', 'Sessioni pratiche per accompagnare il team vendite nell\'utilizzo quotidiano del nuovo strumento.', 'da iniziare', 'Analisi', 'Bassa', '', '2026-11-15', '2026-03-15', '6h 0m', 41),
(99, 'Censimento consumi energetici sedi aziendali', 'Raccolta dei dati di consumo elettrico e idrico di tutte le sedi negli ultimi tre anni.', 'da iniziare', 'Analisi', 'Media', '', '2026-10-01', '2026-09-01', '10h 0m', 42),
(100, 'Definizione piano riduzione emissioni CO2', 'Stesura degli obiettivi annuali di riduzione delle emissioni con relative azioni concrete.', 'da iniziare', 'Analisi', 'Media', '', '2026-12-01', '2026-09-01', '12h 0m', 42),
(101, 'Installazione pannelli fotovoltaici sede centrale', 'Coordinamento dei lavori di installazione dell\'impianto fotovoltaico sul tetto della sede centrale.', 'da iniziare', 'Analisi', 'Bassa', '', '2027-03-01', '2026-09-01', '8h 0m', 42),
(102, 'Comunicazione interna iniziative green', 'Newsletter periodica e bacheca interna per aggiornare i dipendenti sui progressi del programma.', 'da iniziare', 'Marketing', 'Bassa', '', '2027-01-15', '2026-09-01', '4h 0m', 42);

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
  ADD KEY `id_task` (`id_task`),
  ADD KEY `FK717p2wt8bl2clfcqujgmv3161` (`id_dipendente`);

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
  MODIFY `id_dipendente` bigint(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=66;

--
-- AUTO_INCREMENT per la tabella `dipendente_assegna_task`
--
ALTER TABLE `dipendente_assegna_task`
  MODIFY `id_dipendente_assegna_task` bigint(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=179;

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
  MODIFY `id_storico` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=86;

--
-- AUTO_INCREMENT per la tabella `task`
--
ALTER TABLE `task`
  MODIFY `id_task` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=103;

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
  ADD CONSTRAINT `FK717p2wt8bl2clfcqujgmv3161` FOREIGN KEY (`id_dipendente`) REFERENCES `dipendente` (`id_dipendente`),
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
