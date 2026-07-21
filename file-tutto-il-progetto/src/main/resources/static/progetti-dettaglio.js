(() => {
    'use strict';

    /* ________________________________________________________________________________________________________________________

    STRATO DI ACCESSO API — chiama il backend reale (Spring Boot).
    _________________________________________________________________________________________________________________________
    Endpoint usati:
        GET   /dipendenti/{id}
        GET   /progetti/{id}

    NOTE SUI LIMITI ATTUALI DEL BACKEND:
    - Non esiste ancora un endpoint di login/sessione: l'utente loggato è simulato
      con un ID fisso (CURRENT_DIPENDENTE_ID).
    - Progetto non ha campi per date di inizio/fine, data creazione/aggiornamento:
      restano "—" finché il backend non li espone.
    - Le attività del progetto arrivano annidate dentro la risposta di /progetti/{id}
      (campo "attivita"); ricerca e filtro per stato sono applicati lato client.
    - Il "manager" è dedotto dagli associati al progetto con ruolo che contiene
      "manager" o "capoprogetto"; se non presente resta "—".
    ────────────────────────────────────────────────────── */

    const BASE_URL = '';
    const CURRENT_USER = Session.requireLogin();
    const CURRENT_DIPENDENTE_ID = CURRENT_USER ? CURRENT_USER.idDipendente : null;

    const AVATAR_COLORS = ['blue', 'green', 'orange', 'red', 'purple']; // 'slate' escluso: riservato ai placeholder senza persona assegnata (vedi avatarColor: 'slate' sotto)
    function colorForName(name) {
        let hash = 0;
        for (let i = 0; i < (name || '').length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
        return AVATAR_COLORS[hash % AVATAR_COLORS.length];
    }

    // Iniziali di nome e cognome, sempre entrambe maiuscole (es. "Mario Rossi" -> "MR").
    function initialsFromName(name) {
        const parts = (name || '').trim().split(/\s+/).filter(Boolean);
        if (!parts.length) return '?';
        const first = parts[0].charAt(0).toUpperCase();
        const last = parts.length > 1 ? parts[parts.length - 1].charAt(0).toUpperCase() : '';
        return first + last;
    }

    async function apiGetCurrentUser() {
        const res = await Session.authFetch(`${BASE_URL}/dipendenti/${CURRENT_DIPENDENTE_ID}`);
        if (!res.ok) throw new Error(`Errore API: ${res.status}`);
        const d = await res.json();
        const name = `${d.nome} ${d.cognome}`.trim();
        return {
            name,
            role: d.area,
            isAdmin: !!d.isAdmin,
            initials: initialsFromName(name),
            avatarColor: colorForName(name)
        };
    }

    function normalizeTask(raw) {
        return {
            id: raw.idTask,
            title: raw.titolo,
            isRecurring: false, // il backend non modella ancora la ricorrenza
            priority: raw.priorita,
            status: raw.stato,
            progress: raw.stato === 'completato' ? 100 : (raw.stato === 'da iniziare' ? 0 : null),
            dueDate: raw.scadenza,
            estimatedTime: raw.tempoStimato,
            assignees: (raw.assegnati || [])
                .filter(a => a.dipendente)
                .map(a => ({ id: a.dipendente.idDipendente, name: `${a.dipendente.nome} ${a.dipendente.cognome}`.trim() })),
            category: raw.tipologia,
            description: raw.descrizione
        };
    }

    function findTeamLeader(associati) {
        const found = (associati || []).find(a => (a.ruolo || '').toLowerCase() === 'capoprogetto');
        if (!found || !found.dipendente) return null;
        const name = `${found.dipendente.nome} ${found.dipendente.cognome}`.trim();
        return { id: found.dipendente.idDipendente, name, avatarColor: colorForName(name) };
    }

    // Ruolo dell'utente corrente su QUESTO progetto: 'admin' (globale, tutti i progetti),
    // 'teamleader'/'employee' (dedotto da Associato.ruolo su questo progetto — i valori
    // reali sono 'Dipendente' per sola lettura, qualunque altro valore — es. 'CapoProgetto',
    // 'Amministratore' — dà accesso alla gestione dei task), o null se non associato.
    function myRoleOnProject(associati) {
        if (CURRENT_USER && CURRENT_USER.isAdmin) return 'admin';
        const mine = (associati || []).find(a => a.dipendente && a.dipendente.idDipendente === CURRENT_DIPENDENTE_ID);
        if (!mine) return null;
        return (mine.ruolo || '').toLowerCase() === 'dipendente' ? 'employee' : 'teamleader';
    }

    function normalizeProject(raw) {
        const attivita = raw.attivita || [];
        const tasksTotal = attivita.length;
        const tasksCompleted = attivita.filter(a => a.stato === 'completato').length;
        const progress = tasksTotal ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;

        const associati = raw.associati || [];
        const teamLeader = findTeamLeader(associati);
        const members = associati
            .filter(a => a.dipendente)
            .map(a => {
                const name = `${a.dipendente.nome} ${a.dipendente.cognome}`.trim();
                return { name, avatarColor: colorForName(name) };
            });

        const role = myRoleOnProject(associati);

        return {
            id: raw.idProgetto,
            title: raw.nome,
            status: raw.stato,
            description: raw.descrizione,
            progress,
            tasksCompleted,
            tasksTotal,
            manager: teamLeader || { name: '—', avatarColor: 'slate' },
            members,
            currentAssociati: associati,
            startDate: raw.dataInizio || null,
            endDate: raw.dataFine || null,
            createdAt: raw.dataCreazione ? raw.dataCreazione.slice(0, 10) : null,
            updatedAt: raw.dataAggiornamento ? raw.dataAggiornamento.slice(0, 10) : null,
            tasks: attivita.map(normalizeTask),
            canManageTasks: role === 'admin' || role === 'teamleader',
            canManageProject: role === 'admin'
        };
    }

    async function apiGetProject(id) {
        const res = await Session.authFetch(`${BASE_URL}/progetti/${id}`);
        if (!res.ok) throw new Error(`Errore API: ${res.status}`);
        const raw = await res.json();
        return normalizeProject(raw);
    }

    async function apiGetDipendenti() {
        const res = await Session.authFetch(`${BASE_URL}/dipendenti/lista`);
        if (!res.ok) throw new Error(`Errore API: ${res.status}`);
        return res.json();
    }

    async function parseErrorMessage(res, fallback) {
        try {
            const body = await res.json();
            return body && body.messaggio ? body.messaggio : fallback;
        } catch {
            return fallback;
        }
    }

    // La colonna data_fine è NOT NULL sia per gli assegnamenti task che per le
    // associazioni progetto: usiamo una data lontana come "nessuna scadenza".
    const FAR_FUTURE_DATE = '2099-12-31';

    async function apiUpdateProject(id, payload) {
        const res = await Session.authFetch(`${BASE_URL}/progetti/modifica/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nome: payload.nome, descrizione: payload.descrizione, stato: payload.stato,
                dataInizio: payload.dataInizio || null, dataFine: payload.dataFine || null
            })
        });
        if (!res.ok) throw new Error(await parseErrorMessage(res, `Errore API: ${res.status}`));

        // Sostituisce interamente il team: elimina le associazioni esistenti e ricrea quelle scelte.
        for (const a of currentProject.currentAssociati) {
            await Session.authFetch(`${BASE_URL}/associati/${a.idDipendenteAssociatoProgetto}`, { method: 'DELETE' });
        }
        const today = new Date().toISOString().slice(0, 10);
        const uniqueMembers = new Map();
        if (payload.teamLeaderId) uniqueMembers.set(Number(payload.teamLeaderId), 'CapoProgetto');
        payload.memberIds.forEach(mid => {
            const num = Number(mid);
            if (!uniqueMembers.has(num)) uniqueMembers.set(num, 'Dipendente');
        });
        for (const [idDipendente, ruolo] of uniqueMembers) {
            await Session.authFetch(`${BASE_URL}/associati`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idDipendente, idProgetto: Number(id), ruolo, dataInizio: today, dataFine: FAR_FUTURE_DATE })
            });
        }

        return res.json();
    }

    async function apiDeleteProject(id) {
        const res = await Session.authFetch(`${BASE_URL}/progetti/elimina/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(await parseErrorMessage(res, `Errore API: ${res.status}`));
    }

    function formatMinutes(totalMinutes) {
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return `${h}h ${m}m`;
    }

    // Dati storici usano il formato "N ore"; le voci create/modificate da questa app
    // usano "Xh Ym" (vedi formatMinutes) — entrambi vanno riconosciuti in lettura.
    function parseMinutes(formatted) {
        const s = (formatted || '').trim();
        let match = /^(\d+)h\s*(\d+)m$/.exec(s);
        if (match) return Number(match[1]) * 60 + Number(match[2]);
        match = /^(\d+)\s*or[ae]$/.exec(s);
        if (match) return Number(match[1]) * 60;
        return 0;
    }

    async function apiCreateTask(projectId, payload) {
        const body = {
            titolo: payload.title,
            descrizione: payload.description,
            dataAssegnazione: new Date().toISOString().slice(0, 10),
            scadenza: payload.dueDate || FAR_FUTURE_DATE,
            tempoStimato: formatMinutes(Number(payload.estimatedMinutes) || 0),
            stato: payload.status,
            tipologia: payload.category,
            priorita: payload.priority,
            idProgetto: Number(projectId)
        };

        const res = await Session.authFetch(`${BASE_URL}/attivita/crea`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error(await parseErrorMessage(res, `Errore API: ${res.status}`));
        const task = await res.json();

        const today = new Date().toISOString().slice(0, 10);
        for (const idDipendente of payload.assigneeIds) {
            await Session.authFetch(`${BASE_URL}/assegnati`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idDipendente: Number(idDipendente), idAttivita: task.idTask, ruolo: 'Membro', dataInizio: today, dataFine: payload.dueDate || FAR_FUTURE_DATE })
            });
        }
        return task;
    }

    async function apiUpdateTask(task, payload) {
        const body = {
            titolo: payload.title,
            descrizione: payload.description,
            scadenza: payload.dueDate || FAR_FUTURE_DATE,
            tempoStimato: formatMinutes(Number(payload.estimatedMinutes) || 0),
            stato: payload.status,
            tipologia: payload.category,
            priorita: payload.priority
        };

        const res = await Session.authFetch(`${BASE_URL}/attivita/modifica/${task.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error(await parseErrorMessage(res, `Errore API: ${res.status}`));

        const currentAssignRes = await Session.authFetch(`${BASE_URL}/assegnati/attivita/${task.id}`);
        const currentAssign = currentAssignRes.ok ? await currentAssignRes.json() : [];
        for (const a of currentAssign) {
            await Session.authFetch(`${BASE_URL}/assegnati/${a.idDipendenteAssegnaTask}`, { method: 'DELETE' });
        }
        const today = new Date().toISOString().slice(0, 10);
        for (const idDipendente of payload.assigneeIds) {
            await Session.authFetch(`${BASE_URL}/assegnati`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idDipendente: Number(idDipendente), idAttivita: task.id, ruolo: 'Membro', dataInizio: today, dataFine: payload.dueDate || FAR_FUTURE_DATE })
            });
        }

        return res.json();
    }

    async function apiDeleteTask(id) {
        const assignRes = await Session.authFetch(`${BASE_URL}/assegnati/attivita/${id}`);
        const assign = assignRes.ok ? await assignRes.json() : [];
        for (const a of assign) {
            await Session.authFetch(`${BASE_URL}/assegnati/${a.idDipendenteAssegnaTask}`, { method: 'DELETE' });
        }
        const res = await Session.authFetch(`${BASE_URL}/attivita/elimina/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(await parseErrorMessage(res, `Errore API: ${res.status}`));
    }

    /* ──────────────────────────────────────────────────────
       STATO LOCALE
    ────────────────────────────────────────────────────── */

    let currentProjectId = null;
    let currentProject = null;
    let allDipendenti = [];
    let currentQuery = '';
    let currentStatusFilter = ''; // '' = tutti gli stati
    let editingTaskId = null;
    let taskPendingDelete = null;

    /* ──────────────────────────────────────────────────────
       HELPERS
    ────────────────────────────────────────────────────── */

    function formatDateIT(iso) {
        return I18N.formatDate(iso);
    }

    function formatDateITLong(iso) {
        return I18N.formatDateLong(iso);
    }

    function isOverdue(iso, status) {
        if (!iso || status === 'completato') return false;
        return new Date(iso + 'T00:00:00') < new Date(new Date().toDateString());
    }

    function capitalize(s) {
        return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
    }

    const STATUS_KEY = {
        completato: 'status.completato', 'in corso': 'status.inCorso',
        'da iniziare': 'status.daIniziare', 'da fare': 'status.daFare',
        'in pausa': 'status.inPausa', bloccato: 'status.bloccato'
    };
    const PRIORITY_KEY = {
        bassa: 'priority.bassa', media: 'priority.media', alta: 'priority.alta', urgente: 'priority.urgente'
    };
    const CATEGORY_KEY = {
        sviluppo: 'category.sviluppo', frontend: 'category.frontend', backend: 'category.backend',
        testing: 'category.testing', analisi: 'category.analisi', devops: 'category.devops',
        sicurezza: 'category.sicurezza'
    };
    function translateStatus(s) {
        const key = STATUS_KEY[(s || '').toLowerCase()];
        return key ? I18N.t(key) : capitalize(s);
    }
    function translatePriority(p) {
        const key = PRIORITY_KEY[(p || '').toLowerCase()];
        return key ? I18N.t(key) : capitalize(p);
    }
    function translateCategory(c) {
        const key = CATEGORY_KEY[(c || '').toLowerCase()];
        return key ? I18N.t(key) : c;
    }

    const PRIORITY_CLASS = {
        alta:    'priority--alta',
        urgente: 'priority--urgente',
        media:   'priority--media',
        bassa:   'priority--bassa'
    };

    const STATUS_CLASS = {
        completato:    'status--completato',
        'in corso':    'status--in-corso',
        'da iniziare': 'status--da-fare',
        'da fare':     'status--da-fare',
        'in pausa':    'status--in-pausa',
        bloccato:      'status--bloccato'
    };

    const STATUS_FILTER_OPTIONS = ['completato', 'in corso', 'bloccato', 'da iniziare'];

    /* ──────────────────────────────────────────────────────
       SVG ICONS
    ────────────────────────────────────────────────────── */

    const ICON = {
        back: `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.56l4.72 4.72a.75.75 0 11-1.06 1.06l-6-6a.75.75 0 010-1.06l6-6a.75.75 0 111.06 1.06l-4.72 4.72H16.25A.75.75 0 0117 10z" clip-rule="evenodd"/>
        </svg>`,
        people: `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M10 9a4 4 0 100-8 4 4 0 000 8zM10 11c-3.87 0-7 2.239-7 5v1a1 1 0 001 1h12a1 1 0 001-1v-1c0-2.761-3.13-5-7-5z"/>
        </svg>`,
        peopleMeta: `<svg class="meta-icon meta-icon--people" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M10 9a4 4 0 100-8 4 4 0 000 8zM10 11c-3.87 0-7 2.239-7 5v1a1 1 0 001 1h12a1 1 0 001-1v-1c0-2.761-3.13-5-7-5z"/>
        </svg>`,
        calendar: `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
        </svg>`,
        calendarMeta: `<svg class="meta-icon meta-icon--calendar" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
        </svg>`,
        clock: `<svg class="meta-icon meta-icon--clock" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
        </svg>`,
        checkbox: `<svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <rect x="3" y="3" width="14" height="14" rx="3" stroke="currentColor" stroke-width="1.6"/>
            <path d="M6.5 10.2l2.2 2.2 4.8-5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,
        chevronDown: `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd"/>
        </svg>`,
        check: `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M16.704 5.29a1 1 0 010 1.415l-7.09 7.09a1 1 0 01-1.415 0L3.296 8.89a1 1 0 111.415-1.415l4.196 4.197 6.382-6.382a1 1 0 011.415 0z" clip-rule="evenodd"/>
        </svg>`,
        recurring: `<svg class="task-title__icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
        </svg>`,
        add: `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd"/>
        </svg>`,
        edit: `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"/>
            <path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd"/>
        </svg>`,
        trash: `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>`
    };

    /* ──────────────────────────────────────────────────────
       RENDER — Testata progetto
    ────────────────────────────────────────────────────── */

    function renderProjectHeader(project) {
        document.getElementById('project-header').innerHTML = `
        <button class="detail-back" type="button" id="back-btn">
            ${ICON.back}
            ${I18N.t('common.back')}
        </button>

        <div class="project-detail-header__row">
            <div class="project-detail-header">
                <div class="project-detail-header__title-row">
                    <h1 class="project-detail-title">${project.title}</h1>
                    <span class="badge-status ${STATUS_CLASS[(project.status || '').toLowerCase()] || ''}">${translateStatus(project.status)}</span>
                </div>
                <p class="project-detail-subtitle">${project.description}</p>
            </div>
            ${project.canManageProject ? `
            <div class="detail-header__actions">
                <button class="btn-edit" type="button" id="project-edit-btn">${ICON.edit} ${I18N.t('common.edit')}</button>
                <button class="btn-delete" type="button" id="project-delete-btn">${ICON.trash} ${I18N.t('common.delete')}</button>
            </div>` : ''}
        </div>

        <div class="info-cards-row">
            <div class="info-card info-card--progress">
                <span class="info-card__label">${I18N.t('progetti.avanzamento')}</span>
                <span class="info-card__value">${project.progress}%</span>
                <div class="progress__track"
                     role="progressbar"
                     aria-valuenow="${project.progress}"
                     aria-valuemin="0"
                     aria-valuemax="100"
                     aria-label="${I18N.t('progetti.avanzamento')} ${project.progress}%">
                    <div class="progress__fill" style="width:${project.progress}%"></div>
                </div>
            </div>
            <div class="info-card">
                <span class="info-card__label">${I18N.t('progetti.attivita')}</span>
                <span class="info-card__value">${project.tasksCompleted}<span style="color:var(--text-muted); font-weight:500; font-size:16px;"> / ${project.tasksTotal}</span></span>
            </div>
            <div class="info-card">
                <span class="info-card__label">${I18N.t('progettiDett.membri')}</span>
                <span class="info-card__value">${project.members.length}</span>
            </div>
            <div class="info-card">
                <span class="info-card__label">${I18N.t('field.scadenza')}</span>
                <span class="info-card__value" style="font-size:18px;">—</span>
            </div>
        </div>

        <div class="detail-columns">
            <div class="detail-card">
                <div class="detail-card__header">
                    ${ICON.people}
                    <span class="detail-card__title">${I18N.t('progetti.team')}</span>
                </div>

                <span class="field-label">${I18N.t('field.teamLeader')}</span>
                <div class="member-chips">
                    <div class="member-chip">
                        <div class="avatar avatar--${project.manager.avatarColor}" style="width:28px;height:28px;font-size:12px;">${initialsFromName(project.manager.name)}</div>
                        <span class="member-chip__name">${project.manager.name}</span>
                    </div>
                </div>

                <span class="field-label">${I18N.t('progettiDett.membri')}</span>
                <div class="member-chips">
                    ${project.members.length ? project.members.map(m => `
                        <div class="member-chip">
                            <div class="avatar avatar--${m.avatarColor}" style="width:28px;height:28px;font-size:12px;">${initialsFromName(m.name)}</div>
                            <span class="member-chip__name">${m.name}</span>
                        </div>
                    `).join('') : '<span class="member-chip__name">—</span>'}
                </div>
            </div>

            <div class="detail-card">
                <div class="detail-card__header">
                    ${ICON.calendar}
                    <span class="detail-card__title">${I18N.t('field.data')}</span>
                </div>
                <div class="date-rows">
                    <div class="date-row">
                        <span class="date-row__label">${I18N.t('progettiDett.dataInizio')}</span>
                        <span class="date-row__value">${formatDateITLong(project.startDate)}</span>
                    </div>
                    <div class="date-row">
                        <span class="date-row__label">${I18N.t('progettiDett.dataFine')}</span>
                        <span class="date-row__value">${formatDateITLong(project.endDate)}</span>
                    </div>
                    <div class="date-row">
                        <span class="date-row__label">${I18N.t('progettiDett.creatoIl')}</span>
                        <span class="date-row__value">${formatDateITLong(project.createdAt)}</span>
                    </div>
                    <div class="date-row">
                        <span class="date-row__label">${I18N.t('progettiDett.aggiornatoIl')}</span>
                        <span class="date-row__value">${formatDateITLong(project.updatedAt)}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="section-heading-row">
            <div class="section-heading">
                ${ICON.checkbox}
                <span class="section-heading__title">${I18N.t('progetti.attivita')}</span>
            </div>
            ${project.canManageTasks ? `
            <button class="btn-add" type="button" id="new-task-btn">
                ${ICON.add}
                ${I18N.t('progettiDett.newTask')}
            </button>` : ''}
        </div>

        <div class="search-filter-row">
            <div class="search-bar">
                <svg class="search-bar__icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
                </svg>
                <input
                    type="search"
                    class="search-bar__input"
                    id="search-input"
                    placeholder="${I18N.t('common.search')}"
                    aria-label="${I18N.t('progettiDett.searchAria')}"
                    autocomplete="off"
                >
            </div>
            <div class="status-filter" id="status-filter">
                <button class="status-filter__btn" type="button" id="status-filter-btn" aria-haspopup="true" aria-expanded="false">
                    <span id="status-filter-label">${I18N.t('status.tuttiGliStati')}</span>
                    ${ICON.chevronDown}
                </button>
                <div class="status-filter__menu" id="status-filter-menu" hidden>
                    <button class="status-filter__option is-selected" type="button" data-status="">
                        ${I18N.t('status.tuttiGliStati')}
                    </button>
                    ${STATUS_FILTER_OPTIONS.map(s => `
                        <button class="status-filter__option" type="button" data-status="${s}">
                            ${translateStatus(s)}
                        </button>
                    `).join('')}
                </div>
            </div>
        </div>

        <section class="task-list" id="task-list" aria-label="${I18N.t('progettiDett.taskListAria')}">
            <p class="state state--loading">${I18N.t('common.loading')}</p>
        </section>`;

        document.getElementById('back-btn').addEventListener('click', () => {
            if (document.referrer && new URL(document.referrer).origin === location.origin) {
                history.back();
            } else {
                location.href = 'progetti.html';
            }
        });

        if (project.canManageProject) {
            document.getElementById('project-edit-btn').addEventListener('click', openProjectEditModal);
            document.getElementById('project-delete-btn').addEventListener('click', openProjectDeleteModal);
        }
        if (project.canManageTasks) {
            document.getElementById('new-task-btn').addEventListener('click', () => openTaskModal(null));
        }

        initStatusFilter();
        document.getElementById('search-input').addEventListener('input', onSearch);
    }

    /* ──────────────────────────────────────────────────────
       RENDER — Lista attività
    ────────────────────────────────────────────────────── */

    function renderTaskCard(task) {
        const overdue = isOverdue(task.dueDate, task.status);

        const dateEl = task.dueDate
            ? `<span class="task-meta__item ${overdue ? 'task-meta__item--overdue' : ''}">
                   ${ICON.calendarMeta}
                   <span>${formatDateIT(task.dueDate)}</span>
               </span>`
            : '';

        const progressEl = task.progress !== null
            ? `<div class="task-card__progress-box progress">
                   <div class="progress__header">
                       <span class="progress__label">${I18N.t('progetti.avanzamento')}</span>
                       <span class="progress__value">${task.progress}%</span>
                   </div>
                   <div class="progress__track"
                        role="progressbar"
                        aria-valuenow="${task.progress}"
                        aria-valuemin="0"
                        aria-valuemax="100"
                        aria-label="${I18N.t('progetti.avanzamento')} ${task.progress}%">
                       <div class="progress__fill" style="width:${task.progress}%"></div>
                   </div>
               </div>`
            : '';

        return `
        <article class="task-card" data-id="${task.id}">
            <div class="task-card__main">
                <h3 class="task-card__title">
                    ${task.title}
                    ${task.isRecurring ? ICON.recurring : ''}
                </h3>
                <p class="task-card__desc">${task.description}</p>
                <div class="task-meta">
                    ${dateEl}
                    <span class="task-meta__item">
                        ${ICON.clock}
                        <span>${task.estimatedTime}</span>
                    </span>
                    <span class="task-meta__item">
                        ${ICON.peopleMeta}
                        <span>${task.assignees.map(a => a.name).join(', ') || '—'}</span>
                    </span>
                    <span class="task-meta__tag">${translateCategory(task.category)}</span>
                </div>
            </div>
            <div class="task-card__side">
                <div class="task-card__badges">
                    <span class="badge-priority ${PRIORITY_CLASS[(task.priority || '').toLowerCase()] || ''}">${translatePriority(task.priority)}</span>
                    <span class="badge-status ${STATUS_CLASS[(task.status || '').toLowerCase()] || ''}">${translateStatus(task.status)}</span>
                </div>
                ${progressEl}
                ${currentProject && currentProject.canManageTasks ? `
                <div class="task-card__side-actions">
                    <button class="icon-btn icon-btn--edit" type="button" data-edit-id="${task.id}" aria-label="${I18N.t('attivita.editAria')}">${ICON.edit}</button>
                    <button class="icon-btn icon-btn--delete" type="button" data-delete-id="${task.id}" aria-label="${I18N.t('attivita.deleteAria')}">${ICON.trash}</button>
                </div>` : ''}
            </div>
        </article>`;
    }

    function renderTasks(tasks) {
        const list = document.getElementById('task-list');
        if (!list) return;

        if (tasks.length === 0) {
            list.innerHTML = `<p class="state state--empty">${I18N.t('progettiDett.noTasksFound')}</p>`;
            return;
        }

        list.innerHTML = tasks.map(renderTaskCard).join('');

        list.querySelectorAll('.task-card').forEach(card => {
            card.addEventListener('click', () => {
                location.href = `attivita-dettaglio.html?id=${card.dataset.id}`;
            });
        });

        list.querySelectorAll('[data-edit-id]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const task = currentProject.tasks.find(t => t.id === Number(btn.dataset.editId));
                if (task) openTaskModal(task);
            });
        });

        list.querySelectorAll('[data-delete-id]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const task = currentProject.tasks.find(t => t.id === Number(btn.dataset.deleteId));
                if (task) openDeleteModal(task);
            });
        });
    }

    /* ──────────────────────────────────────────────────────
       FILTRO STATO (dropdown)
    ────────────────────────────────────────────────────── */

    function initStatusFilter() {
        const filter = document.getElementById('status-filter');
        const btn = document.getElementById('status-filter-btn');
        const menu = document.getElementById('status-filter-menu');

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = !menu.hidden;
            menu.hidden = isOpen;
            filter.classList.toggle('is-open', !isOpen);
            btn.setAttribute('aria-expanded', String(!isOpen));
        });

        menu.querySelectorAll('.status-filter__option').forEach(opt => {
            opt.addEventListener('click', () => {
                currentStatusFilter = opt.dataset.status;
                document.getElementById('status-filter-label').textContent =
                    currentStatusFilter ? translateStatus(currentStatusFilter) : I18N.t('status.tuttiGliStati');

                menu.querySelectorAll('.status-filter__option').forEach(o =>
                    o.classList.toggle('is-selected', o === opt)
                );

                menu.hidden = true;
                filter.classList.remove('is-open');
                btn.setAttribute('aria-expanded', 'false');

                applyTaskFilters();
            });
        });

        document.addEventListener('click', (e) => {
            if (!filter.contains(e.target)) {
                menu.hidden = true;
                filter.classList.remove('is-open');
                btn.setAttribute('aria-expanded', 'false');
            }
        });
    }

    /* ──────────────────────────────────────────────────────
       FILTRO LOCALE (ricerca + stato applicati sui dati già caricati)
    ────────────────────────────────────────────────────── */

    function applyTaskFilters() {
        const q = currentQuery.toLowerCase();
        let tasks = currentProject ? currentProject.tasks : [];
        if (q) {
            tasks = tasks.filter(t =>
                t.title.toLowerCase().includes(q) ||
                t.description.toLowerCase().includes(q) ||
                t.category.toLowerCase().includes(q)
            );
        }
        if (currentStatusFilter) {
            tasks = tasks.filter(t => t.status === currentStatusFilter);
        }
        renderTasks(tasks);
    }

    /* ──────────────────────────────────────────────────────
       MODALE — Modifica progetto
    ────────────────────────────────────────────────────── */

    function renderRadioList(containerId, items, isChecked, valueOf, labelOf, subLabelOf) {
        const container = document.getElementById(containerId);
        container.innerHTML = items.map(item => `
            <label class="checklist__item">
                <span class="checklist__item-label">
                    ${labelOf(item)}
                    ${subLabelOf ? `<span class="checklist__item-dept">${subLabelOf(item)}</span>` : ''}
                </span>
                <input type="radio" name="${containerId}" value="${valueOf(item)}" ${isChecked(item) ? 'checked' : ''}>
            </label>`).join('');
    }

    function renderChecklist(containerId, items, isChecked, valueOf, labelOf, subLabelOf) {
        const container = document.getElementById(containerId);
        container.innerHTML = items.map(item => `
            <label class="checklist__item">
                <span class="checklist__item-label">
                    ${labelOf(item)}
                    ${subLabelOf ? `<span class="checklist__item-dept">${subLabelOf(item)}</span>` : ''}
                </span>
                <input type="checkbox" value="${valueOf(item)}" ${isChecked(item) ? 'checked' : ''}>
            </label>`).join('');
    }

    function getCheckedValues(containerId) {
        return Array.from(document.querySelectorAll(`#${containerId} input:checked`)).map(i => i.value);
    }

    function getRadioValue(containerId) {
        const checked = document.querySelector(`#${containerId} input:checked`);
        return checked ? checked.value : null;
    }

    function openProjectEditModal() {
        document.getElementById('project-edit-nome').value = currentProject.title;
        document.getElementById('project-edit-desc').value = currentProject.description || '';
        document.getElementById('project-edit-stato').value = (currentProject.status || '').toLowerCase();
        document.getElementById('project-edit-data-inizio').value = currentProject.startDate || '';
        document.getElementById('project-edit-data-fine').value = currentProject.endDate || '';
        document.getElementById('project-edit-form-error').hidden = true;

        const teamLeaderId = currentProject.currentAssociati.find(a => (a.ruolo || '').toLowerCase() === 'capoprogetto' && a.dipendente)?.dipendente.idDipendente;
        const memberIds = currentProject.currentAssociati.filter(a => a.dipendente).map(a => a.dipendente.idDipendente);

        document.getElementById('project-edit-manager-search').value = '';
        document.getElementById('project-edit-members-search').value = '';
        renderRadioList('project-edit-manager', allDipendenti, d => d.idDipendente === teamLeaderId, d => d.idDipendente, d => `${d.nome} ${d.cognome}`, d => d.area);
        renderChecklist('project-edit-members', allDipendenti, d => memberIds.includes(d.idDipendente), d => d.idDipendente, d => `${d.nome} ${d.cognome}`, d => d.area);

        document.getElementById('project-edit-modal-overlay').hidden = false;
    }

    function closeProjectEditModal() {
        document.getElementById('project-edit-modal-overlay').hidden = true;
    }

    async function onSubmitProjectEditForm(e) {
        e.preventDefault();
        const saveBtn = document.getElementById('project-edit-save-btn');
        const errorEl = document.getElementById('project-edit-form-error');
        errorEl.hidden = true;

        const payload = {
            nome: document.getElementById('project-edit-nome').value.trim(),
            descrizione: document.getElementById('project-edit-desc').value.trim(),
            stato: document.getElementById('project-edit-stato').value,
            dataInizio: document.getElementById('project-edit-data-inizio').value || null,
            dataFine: document.getElementById('project-edit-data-fine').value || null,
            teamLeaderId: getRadioValue('project-edit-manager'),
            memberIds: getCheckedValues('project-edit-members')
        };

        saveBtn.disabled = true;
        try {
            await apiUpdateProject(currentProjectId, payload);
            closeProjectEditModal();
            await loadProject();
            Toast.success(I18N.t('progettiDett.updatedSuccess'));
        } catch (err) {
            const message = err.message || I18N.t('progettiDett.updateError');
            errorEl.textContent = message;
            errorEl.hidden = false;
            Toast.error(message);
            console.error('[onSubmitProjectEditForm]', err);
        } finally {
            saveBtn.disabled = false;
        }
    }

    /* ──────────────────────────────────────────────────────
       MODALE — Elimina progetto
    ────────────────────────────────────────────────────── */

    function openProjectDeleteModal() {
        document.getElementById('project-delete-title').textContent = currentProject.title;
        document.getElementById('project-delete-form-error').hidden = true;
        document.getElementById('project-delete-modal-overlay').hidden = false;
    }

    function closeProjectDeleteModal() {
        document.getElementById('project-delete-modal-overlay').hidden = true;
    }

    async function onConfirmProjectDelete() {
        const confirmBtn = document.getElementById('project-delete-confirm-btn');
        const errorEl = document.getElementById('project-delete-form-error');
        errorEl.hidden = true;
        confirmBtn.disabled = true;
        try {
            await apiDeleteProject(currentProjectId);
            Toast.successBeforeNavigate(I18N.t('progettiDett.deletedSuccess'));
            location.href = 'progetti.html';
        } catch (err) {
            const message = err.message || I18N.t('progettiDett.deleteError');
            errorEl.textContent = message;
            errorEl.hidden = false;
            Toast.error(message);
            console.error('[onConfirmProjectDelete]', err);
        } finally {
            confirmBtn.disabled = false;
        }
    }

    /* ──────────────────────────────────────────────────────
       MODALE — Crea / Modifica attività
    ────────────────────────────────────────────────────── */

    function openTaskModal(task) {
        editingTaskId = task ? task.id : null;
        document.getElementById('edit-modal-title').textContent = task ? I18N.t('progettiDett.editTaskTitle') : I18N.t('progettiDett.newTaskModalTitle');
        document.getElementById('edit-form-error').hidden = true;

        document.getElementById('edit-title').value = task ? task.title : '';
        document.getElementById('edit-desc').value = task ? (task.description || '') : '';
        document.getElementById('edit-priority').value = task ? (task.priority || '').toLowerCase() : 'media';
        document.getElementById('edit-category').value = task ? (task.category || '').toLowerCase() : 'sviluppo';
        document.getElementById('edit-status').value = task ? (task.status || '').toLowerCase() : 'da iniziare';
        const estimated = minutesToValueUnit(task ? parseMinutes(task.estimatedTime) : 0);
        document.getElementById('edit-estimated').value = task ? estimated.value : '';
        document.getElementById('edit-estimated-unit').value = estimated.unit;
        document.getElementById('edit-due-date').value = task ? (task.dueDate || '') : '';

        const assigneeIds = task ? task.assignees.map(a => a.id) : [];
        document.getElementById('edit-assignees-search').value = '';
        renderChecklist(
            'edit-assignees', allDipendenti,
            d => assigneeIds.includes(d.idDipendente),
            d => d.idDipendente, d => `${d.nome} ${d.cognome}`, d => d.area
        );

        document.getElementById('edit-modal-overlay').hidden = false;
    }

    function closeEditModal() {
        document.getElementById('edit-modal-overlay').hidden = true;
    }

    async function onSubmitEditForm(e) {
        e.preventDefault();
        const saveBtn = document.getElementById('edit-save-btn');
        const errorEl = document.getElementById('edit-form-error');
        errorEl.hidden = true;

        const payload = {
            title: document.getElementById('edit-title').value.trim(),
            description: document.getElementById('edit-desc').value.trim(),
            priority: document.getElementById('edit-priority').value,
            category: document.getElementById('edit-category').value,
            status: document.getElementById('edit-status').value,
            estimatedMinutes: valueUnitToMinutes(document.getElementById('edit-estimated').value, document.getElementById('edit-estimated-unit').value),
            dueDate: document.getElementById('edit-due-date').value || null,
            assigneeIds: getCheckedValues('edit-assignees')
        };

        saveBtn.disabled = true;
        try {
            const isEditing = !!editingTaskId;
            if (isEditing) {
                const task = currentProject.tasks.find(t => t.id === editingTaskId);
                await apiUpdateTask(task, payload);
            } else {
                await apiCreateTask(currentProjectId, payload);
            }
            closeEditModal();
            await loadProject();
            Toast.success(isEditing ? I18N.t('progettiDett.taskUpdatedSuccess') : I18N.t('progettiDett.taskCreatedSuccess'));
        } catch (err) {
            const message = err.message || I18N.t('progettiDett.updateError');
            errorEl.textContent = message;
            errorEl.hidden = false;
            Toast.error(message);
            console.error('[onSubmitEditForm]', err);
        } finally {
            saveBtn.disabled = false;
        }
    }

    /* ──────────────────────────────────────────────────────
       MODALE — Elimina attività
    ────────────────────────────────────────────────────── */

    function openDeleteModal(task) {
        taskPendingDelete = task;
        document.getElementById('delete-task-title').textContent = task.title;
        document.getElementById('delete-form-error').hidden = true;
        document.getElementById('delete-modal-overlay').hidden = false;
    }

    function closeDeleteModal() {
        document.getElementById('delete-modal-overlay').hidden = true;
    }

    async function onConfirmDelete() {
        if (!taskPendingDelete) return;
        const confirmBtn = document.getElementById('delete-confirm-btn');
        const errorEl = document.getElementById('delete-form-error');
        errorEl.hidden = true;
        confirmBtn.disabled = true;
        try {
            await apiDeleteTask(taskPendingDelete.id);
            closeDeleteModal();
            await loadProject();
            Toast.success(I18N.t('progettiDett.taskDeletedSuccess'));
        } catch (err) {
            const message = err.message || I18N.t('progettiDett.deleteError');
            errorEl.textContent = message;
            errorEl.hidden = false;
            Toast.error(message);
            console.error('[onConfirmDelete]', err);
        } finally {
            confirmBtn.disabled = false;
        }
    }

    /* ──────────────────────────────────────────────────────
       DATA LOADING
    ────────────────────────────────────────────────────── */

    async function loadProject() {
        const main = document.getElementById('main-content');
        const params = new URLSearchParams(location.search);
        const id = Number(params.get('id'));

        if (!id) {
            main.innerHTML = `<p class="state state--error">${I18N.t('progettiDett.noProjectSpecified')}</p>`;
            return;
        }

        try {
            currentProjectId = id;
            currentProject = await apiGetProject(id);
            renderProjectHeader(currentProject);
            applyTaskFilters();
        } catch (err) {
            main.innerHTML = `<p class="state state--error">${I18N.t('progettiDett.notFound')}</p>`;
            console.error('[loadProject]', err);
        }
    }

    async function loadReferenceData() {
        try {
            allDipendenti = await apiGetDipendenti();
        } catch (err) {
            console.error('[loadReferenceData]', err);
        }
    }

    async function loadUser() {
        try {
            const user = await apiGetCurrentUser();
            const avatarEl = document.getElementById('user-avatar');
            if (avatarEl) {
                avatarEl.textContent = user.initials;
                avatarEl.className = `avatar avatar--${user.avatarColor}`;
            }
            const nameEl = document.getElementById('user-name');
            if (nameEl) nameEl.textContent = user.name;
            const roleEl = document.getElementById('user-role');
            if (roleEl) roleEl.textContent = user.role;
            const isManager = user.isAdmin || await Session.isManager();
            const navUtentiEl = document.getElementById('nav-utenti');
            if (navUtentiEl) navUtentiEl.hidden = !isManager;
            const navReportLabelEl = document.getElementById('nav-report-label');
            if (navReportLabelEl) navReportLabelEl.textContent = isManager ? I18N.t('nav.analisi') : I18N.t('nav.storico');
        } catch (err) {
            console.error('[loadUser]', err);
        }
    }

    /* ──────────────────────────────────────────────────────
       SEARCH (debounced)
    ────────────────────────────────────────────────────── */

    let searchTimer;
    function onSearch(e) {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            currentQuery = e.target.value.trim();
            applyTaskFilters();
        }, 280);
    }

    /* ──────────────────────────────────────────────────────
       INIT
    ────────────────────────────────────────────────────── */

    document.addEventListener('DOMContentLoaded', () => {
        Promise.all([loadUser(), loadReferenceData(), loadProject()]);
        document.getElementById('logout-btn').addEventListener('click', Session.logout);

        setupChecklistSearch('project-edit-manager-search', 'project-edit-manager');
        setupChecklistSearch('project-edit-members-search', 'project-edit-members');
        setupChecklistSearch('edit-assignees-search', 'edit-assignees');

        document.getElementById('project-edit-modal-close-btn').addEventListener('click', closeProjectEditModal);
        document.getElementById('project-edit-cancel-btn').addEventListener('click', closeProjectEditModal);
        document.getElementById('project-edit-form').addEventListener('submit', onSubmitProjectEditForm);
        document.getElementById('project-edit-modal-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'project-edit-modal-overlay') closeProjectEditModal();
        });

        document.getElementById('project-delete-modal-close-btn').addEventListener('click', closeProjectDeleteModal);
        document.getElementById('project-delete-cancel-btn').addEventListener('click', closeProjectDeleteModal);
        document.getElementById('project-delete-confirm-btn').addEventListener('click', onConfirmProjectDelete);
        document.getElementById('project-delete-modal-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'project-delete-modal-overlay') closeProjectDeleteModal();
        });

        document.getElementById('edit-modal-close-btn').addEventListener('click', closeEditModal);
        document.getElementById('edit-cancel-btn').addEventListener('click', closeEditModal);
        document.getElementById('edit-form').addEventListener('submit', onSubmitEditForm);
        document.getElementById('edit-modal-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'edit-modal-overlay') closeEditModal();
        });

        document.getElementById('delete-modal-close-btn').addEventListener('click', closeDeleteModal);
        document.getElementById('delete-cancel-btn').addEventListener('click', closeDeleteModal);
        document.getElementById('delete-confirm-btn').addEventListener('click', onConfirmDelete);
        document.getElementById('delete-modal-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'delete-modal-overlay') closeDeleteModal();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape') return;
            if (!document.getElementById('project-edit-modal-overlay').hidden) closeProjectEditModal();
            if (!document.getElementById('project-delete-modal-overlay').hidden) closeProjectDeleteModal();
            if (!document.getElementById('edit-modal-overlay').hidden) closeEditModal();
            if (!document.getElementById('delete-modal-overlay').hidden) closeDeleteModal();
        });
    });

    document.addEventListener('i18n:change', () => {
        loadUser();
        if (currentProject) {
            renderProjectHeader(currentProject);
            applyTaskFilters();
        }
    });

})();
