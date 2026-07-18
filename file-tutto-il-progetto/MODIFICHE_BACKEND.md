# Modifiche al backend

Documentazione di tutte le modifiche e aggiunte apportate al backend Spring Boot (`src/main/java/com/example/gestionale`) rispetto alla versione precedente. Il frontend statico non è incluso in questo documento.

---

## 1. Sicurezza e autenticazione

### 1.1 Password salvata in chiaro alla creazione di un dipendente
**File:** `services/DipendenteService.java` — metodo `salvaDipendente`

L'hash della password veniva calcolato **dopo** aver già costruito l'entità da salvare, quindi il database riceveva la password in chiaro (e il login per quell'utente falliva sempre, dato che l'hash BCrypt non trova mai corrispondenza con un valore non hashato).

**Fix:** l'hash viene ora calcolato sul DTO *prima* di costruire l'entità.

### 1.2 Login: nessun dato utente restituito
**File:** `dto/LoginResponseDTO.java`, `controllers/AuthController.java`

`POST /auth/login` restituiva solo `{ "token": "..." }`. Il frontend salva in sessione l'oggetto restituito dal login e si aspetta di trovarci `idDipendente`, `isAdmin`, ecc. — senza questi dati nessuna pagina oltre al login poteva funzionare.

**Fix:** `LoginResponseDTO` ora include anche `idDipendente`, `nome`, `cognome`, `email`, `area`, `isAdmin`, valorizzati a partire dal `Dipendente` autenticato.

### 1.3 `isAdmin` mai esposto nelle risposte sui dipendenti
**File:** `dto/DipendenteResponseDTO.java`

Il campo `isAdmin` era dichiarato ma mai valorizzato in `fromEntity(...)` e non aveva getter/setter: ogni dipendente risultava sempre "non admin" lato client.

**Fix:** aggiunta la valorizzazione in `fromEntity` e i relativi getter/setter.

### 1.4 Token JWT scaduto o non valido → errore 500 invece di richiesta anonima
**File:** `security/JwtAuthFilter.java`

Il parsing di un token scaduto/malformato lancia `JwtException`, non intercettata: la richiesta falliva con un errore 500 invece di proseguire come non autenticata (comportamento corretto per un filtro JWT).

**Fix:** aggiunto un `try/catch (JwtException)` attorno alla verifica del token.

### 1.5 Accesso ai file statici bloccato senza autenticazione
**File:** `security/SecurityConfig.java`

Non esisteva alcuna regola `permitAll` per `login.html`/`.css`/`.js` e gli altri file statici: ricadevano tutti nel blocco finale `anyRequest().authenticated()`, per cui il browser riceveva 403 prima ancora di poter caricare la pagina di login.

**Fix:** aggiunta `.requestMatchers(HttpMethod.GET, "/", "/*.html", "/*.css", "/*.js").permitAll()`.

### 1.6 `POST /dipendenti/crea` senza alcuna restrizione
**File:** `controllers/DipendenteController.java`

Qualsiasi utente autenticato (non solo l'admin) poteva creare nuovi dipendenti, perché mancava sia una regola URL in `SecurityConfig` sia una `@PreAuthorize` sul metodo.

**Fix:** aggiunta `@PreAuthorize("hasRole('ADMIN')")` su `creaDipendente`.

---

## 2. Bug di autorizzazione (regole `@PreAuthorize` e ruoli)

### 2.1 Riferimento a un parametro inesistente nelle espressioni SpEL
**File:** `controllers/AttivitaController.java`, `controllers/AssegnatoController.java`, `controllers/AssociatoController.java`

Tutte le `@PreAuthorize` che dovevano leggere il corpo della richiesta usavano `#request.campo`, ma il parametro `@RequestBody` si chiama in realtà `attivita`/`assegnato`/`associato` a seconda del controller. Per qualsiasi utente non admin (capoprogetto), la valutazione dell'espressione falliva con un errore non gestito esplicitamente: creare/modificare/eliminare attività, assegnazioni e associazioni come capoprogetto era di fatto impossibile.

**Fix:** tutte le espressioni ora referenziano il nome reale del parametro (`#attivita.idProgetto`, `#assegnato.idAttivita`, `#associato.idProgetto`, ecc.). Per `AttivitaController.eliminaAttivitaPerId` (che non ha un corpo, solo l'id) il controllo è stato riscritto per usare `isCapoProgettoDiAttivita(#id, authentication)`.

### 2.2 Typo nel nome di un bean Spring
**File:** `controllers/AssegnatoController.java` — `modificaAssegnazione`

L'espressione referenziava `@projectAuthService`, un bean inesistente (quello reale è `progettoAuthService`), causando un errore quando un capoprogetto riassegnava un'attività ad un'altra task.

**Fix:** corretto in `@progettoAuthService`.

### 2.3 Valori della costante `RuoliProgetto` disallineati dal dato reale
**File:** `models/RuoliProgetto.java`

`TEAM_LEADER` valeva `"TEAM_LEADER"` e `MEMBRO` valeva `"MEMBRO"`, ma il frontend salva/legge sempre il ruolo di un `Associato` come `"CapoProgetto"` / `"Dipendente"`. Il confronto in `ProgettoAuthService.isCapoProgetto` non trovava mai corrispondenza: **nessun capoprogetto passava mai i controlli di autorizzazione**, su nessuna entità (attività, assegnazioni, associazioni).

**Fix:** `TEAM_LEADER = "CapoProgetto"`, `MEMBRO = "Dipendente"`.

### 2.4 Letterale `'MEMBRO'` non allineato nella `@PreAuthorize`
**File:** `controllers/AssociatoController.java` — `associaDipendenteProgetto`

Indipendentemente dalla costante `RuoliProgetto`, l'espressione conteneva anche il letterale scritto a mano `#associato.ruolo == 'MEMBRO'`, mai allineato al valore reale `"Dipendente"`.

**Fix:** sostituito con `'Dipendente'`.

### 2.5 Nuovo controllo di autorizzazione: capoprogetto di un'associazione
**File:** `security/ProgettoAuthService.java`

Aggiunto il metodo `isCapoProgettoDiAssociato(Long idAssociato, Authentication authentication)`, sullo stesso modello di `isCapoProgettoDiAssegnato`/`isCapoProgettoDiAttivita`: risale al progetto dell'associazione indicata e verifica se l'utente ne è capoprogetto.

### 2.6 `AssociatoController`: PATCH/DELETE senza alcun controllo a livello di metodo
**File:** `controllers/AssociatoController.java`

`modificaAssociazione` ed `eliminaAssociazione` non avevano `@PreAuthorize`: erano protette solo dalla regola URL in `SecurityConfig` (che era `hasRole("ADMIN")`, vedi punto 2.7).

**Fix:** aggiunta `@PreAuthorize("hasRole('ADMIN') or @progettoAuthService.isCapoProgettoDiAssociato(#id, authentication)")` su entrambi gli endpoint.

### 2.7 Conflitto tra regola URL e `@PreAuthorize` su `/associati/**`
**File:** `security/SecurityConfig.java`

Le regole a livello di URL bloccavano `POST`/`PATCH`/`DELETE` su `/associati/**` a soli utenti con ruolo ADMIN — questo controllo veniva valutato dal filtro di sicurezza **prima** che il controller venisse anche solo raggiunto, quindi un capoprogetto veniva respinto a prescindere da cosa dicesse la `@PreAuthorize` del controller (pensata apposta per permettere anche a lui l'operazione, si veda punto 2.6).

**Fix:** allineato a come sono già gestiti `/attivita/**` e `/assegnati/**`: la regola URL richiede solo autenticazione, mentre la restrizione fine (admin o capoprogotto del progetto specifico) è demandata interamente alle `@PreAuthorize` dei metodi.

### 2.8 Typo nel path `/storico/**`
**File:** `security/SecurityConfig.java`

La regola faceva riferimento a `/storico/**`, ma il controller è mappato su `/storici` (con la "i" finale). La regola non scattava mai (non cambiava il comportamento perché il fallback finale richiede comunque autenticazione, ma era comunque un refuso).

**Fix:** corretto in `/storici/**`.

---

## 3. Gestione errori

### 3.1 Rifiuto di autorizzazione → 500 invece di 403
**File:** `exceptions/GlobalExceptionHandler.java`

Non essendoci un handler dedicato, un `AccessDeniedException` (lanciato da qualunque `@PreAuthorize` non superata) veniva intercettato dalla rete di sicurezza generica (`@ExceptionHandler(Exception.class)`), restituendo un fuorviante `500 - Si è verificato un errore imprevisto`.

**Fix:** aggiunto `@ExceptionHandler(AccessDeniedException.class)` che risponde `403 Forbidden` con un messaggio chiaro.

---

## 4. Eliminazione progetto

### 4.1 Un progetto non poteva essere eliminato se aveva ancora dipendenti associati
**File:** `models/Progetto.java`, `services/ProgettoService.java`

Su richiesta esplicita: l'admin deve poter eliminare un progetto anche se ha ancora un capoprogetto/membri associati. Rimuovere il solo controllo lato Java avrebbe causato una violazione del vincolo di chiave esterna sulla tabella `dipendente_associato_progetto` (nessun cascade era configurato).

**Fix:**
- `Progetto.associati` ora ha `cascade = CascadeType.REMOVE`: eliminare il progetto elimina automaticamente anche le sue associazioni ai dipendenti.
- `ProgettoService.eliminaProgettoPerId` non blocca più l'eliminazione per la presenza di associati (usa `progettoRepository.delete(p)` sull'entità già caricata, necessario perché il cascade JPA scatti correttamente).
- Il controllo sulle **attività** collegate resta invariato: un progetto con attività ancora presenti non può essere eliminato finché non vengono rimosse.

---

## 5. Nuova funzionalità: reset password ("password dimenticata")

Prima di questa modifica, `Dipendente` aveva già le colonne `reset_token`/`reset_token_scadenza` e `DipendenteRepository` aveva già `findByResetToken(...)`, ma non erano collegate a nessun endpoint: erano scaffolding morto.

> **Nota — modalità sviluppo:** il progetto non ha (ancora) un server SMTP configurato (manca la dipendenza `spring-boot-starter-mail` e la relativa configurazione). Per questo motivo l'endpoint di richiesta restituisce il token direttamente nella risposta invece di inviarlo via email. **Prima di un utilizzo in produzione va sostituito con un invio email reale**, e la risposta non dovrebbe più esporre il token al client (vedi commenti in `ResetPasswordTokenDTO`, `DipendenteService`, `AuthController`).

### File aggiunti
- `dto/RichiestaResetPasswordDTO.java` — `{ email }`, validato (`@NotBlank`, `@Email`)
- `dto/ResetPasswordDTO.java` — `{ token, nuovaPassword }`, validato (`@NotBlank`, `nuovaPassword` con `@Size(min = 8)`)
- `dto/ResetPasswordTokenDTO.java` — risposta con `{ resetToken, scadenza }`

### File modificati
- `services/DipendenteService.java` — aggiunti:
  - `richiediResetPassword(String email)`: genera un token random (`UUID`), lo salva sul dipendente con scadenza di 60 minuti (`SCADENZA_RESET_MINUTI`), lo restituisce.
  - `confermaResetPassword(String token, String nuovaPassword)`: cerca il dipendente per token, verifica che non sia scaduto, aggiorna la password (hashata) e invalida il token (impostato a `null`, non riutilizzabile).
- `controllers/AuthController.java` — aggiunti due endpoint pubblici (già coperti da `permitAll` su `/auth/**`):

| Metodo | Path | Body | Risposta |
|---|---|---|---|
| `POST` | `/auth/password-dimenticata` | `{ "email": "..." }` | `200` con `{ resetToken, scadenza }`, oppure `404` se l'email non esiste |
| `POST` | `/auth/reset-password` | `{ "token": "...", "nuovaPassword": "..." }` | `204` se riuscito; `400` se il token non è valido; `409` se il token è scaduto |

Entrambi gli endpoint sono stati verificati end-to-end (richiesta → token → reset → login con la nuova password → vecchia password rifiutata → token non riutilizzabile).

---

## Riepilogo file toccati

| File | Tipo di modifica |
|---|---|
| `services/DipendenteService.java` | Bug fix + nuove funzionalità (reset password) |
| `dto/LoginResponseDTO.java` | Arricchito |
| `dto/DipendenteResponseDTO.java` | Bug fix (campo mai esposto) |
| `dto/RichiestaResetPasswordDTO.java` | Nuovo |
| `dto/ResetPasswordDTO.java` | Nuovo |
| `dto/ResetPasswordTokenDTO.java` | Nuovo |
| `controllers/AuthController.java` | Aggiornato + nuovi endpoint |
| `controllers/DipendenteController.java` | Bug fix (autorizzazione mancante) |
| `controllers/AttivitaController.java` | Bug fix (`@PreAuthorize`) |
| `controllers/AssegnatoController.java` | Bug fix (`@PreAuthorize` + typo bean) |
| `controllers/AssociatoController.java` | Bug fix (`@PreAuthorize` mancante/errata) |
| `security/JwtAuthFilter.java` | Bug fix (gestione eccezioni) |
| `security/SecurityConfig.java` | Bug fix (regole URL, accesso file statici) |
| `security/ProgettoAuthService.java` | Nuovo metodo |
| `models/RuoliProgetto.java` | Bug fix (valori costanti) |
| `models/Progetto.java` | Bug fix (cascade eliminazione) |
| `services/ProgettoService.java` | Modifica comportamento eliminazione |
| `exceptions/GlobalExceptionHandler.java` | Nuovo handler |
