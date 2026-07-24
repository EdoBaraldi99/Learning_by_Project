(() => {
    'use strict';

    /* ________________________________________________________________________________________________________________________

    STRATO DI ACCESSO API — chiama il backend reale (Spring Boot).
    _________________________________________________________________________________________________________________________
    Endpoint usati:
        GET  /dipendenti/{id}
        GET  /attivita/{id}

    NOTE SUI LIMITI ATTUALI DEL BACKEND:
    - Non esiste ancora un endpoint di login/sessione: l'utente loggato è simulato
      con un ID fisso (CURRENT_DIPENDENTE_ID).
    - Attivita non ha un campo "creata da": la sezione "Creata da" viene nascosta
      se il dato non è disponibile, invece di mostrare un valore inventato.
    - Storico non ha un riferimento al dipendente che ha registrato la voce: le
      righe di storico sono mostrate senza avatar/nome utente.
    - "Tempo effettivo" è calcolato sommando i tempoLavorato dello storico della
      attività (stesso formato "Xh Ym" del tempo stimato).
    - "progress" non esiste sul backend: viene dedotto dallo stato (Completato → 100,
      Da fare → 0, altrimenti sconosciuto → barra di avanzamento non mostrata).
    ────────────────────────────────────────────────────── */

    const BASE_URL = '';
    const CURRENT_USER = Session.requireLogin();
    const CURRENT_DIPENDENTE_ID = CURRENT_USER ? CURRENT_USER.idDipendente : null;

    let currentTask = null;
    let allDipendenti = [];

    const AVATAR_COLORS = ['blue', 'green', 'orange', 'red', 'purple']; // 'slate' escluso: riservato ai placeholder senza persona assegnata
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

    function formatMinutes(totalMinutes) {
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return `${h}h ${m}m`;
    }

    function normalizeTask(raw) {
        const history = (raw.storico || [])
            .slice()
            .sort((a, b) => (b.data || '').localeCompare(a.data || ''));

        const actualMinutes = history.reduce((sum, h) => sum + parseMinutes(h.tempoLavorato), 0);

        return {
            id: raw.idTask,
            title: raw.titolo,
            status: raw.stato,
            priority: raw.priorita,
            category: raw.tipologia,
            progress: raw.stato === 'completato' ? 100 : (raw.stato === 'da iniziare' ? 0 : null),
            description: raw.descrizione,
            dueDate: raw.scadenza,
            estimatedTime: raw.tempoStimato,
            actualTime: history.length ? formatMinutes(actualMinutes) : '—',
            createdAt: raw.dataAssegnazione,
            updatedAt: null,
            project: raw.progetto
                ? { id: raw.progetto.idProgetto, name: raw.progetto.nome, status: raw.progetto.stato }
                : null,
            assignees: (raw.assegnati || [])
                .filter(a => a.dipendente)
                .map(a => {
                    const name = `${a.dipendente.nome} ${a.dipendente.cognome}`.trim();
                    return { id: a.dipendente.idDipendente, name, department: a.dipendente.area, avatarColor: colorForName(name) };
                }),
            createdBy: null, // il backend non registra chi ha creato l'attività
            history: history.map(h => ({
                date: h.data,
                duration: h.tempoLavorato,
                note: h.descrizione
            }))
        };
    }

    async function apiGetTaskDetail(id) {
        const res = await Session.authFetch(`${BASE_URL}/attivita/${id}`);
        if (!res.ok) throw new Error(`Errore API: ${res.status}`);
        const raw = await res.json();
        return normalizeTask(raw);
    }

    async function apiGetDipendenti() {
        const res = await Session.authFetch(`${BASE_URL}/dipendenti/lista`);
        if (!res.ok) throw new Error(`Errore API: ${res.status}`);
        return res.json();
    }

    // Ruolo dell'utente corrente sul progetto del task: 'admin' (globale), 'teamleader'/'employee'
    // (dedotto da Associato.ruolo su quel progetto), o null se non associato / task senza progetto.
    async function myRoleOnProject(idProgetto) {
        if (CURRENT_USER && CURRENT_USER.isAdmin) return 'admin';
        if (!idProgetto) return null;
        const res = await Session.authFetch(`${BASE_URL}/associati/progetto/${idProgetto}`);
        if (!res.ok) return null;
        const associati = await res.json();
        const mine = associati.find(a => a.dipendente && a.dipendente.idDipendente === CURRENT_DIPENDENTE_ID);
        if (!mine) return null;
        return (mine.ruolo || '').toLowerCase() === 'dipendente' ? 'employee' : 'teamleader';
    }

    async function parseErrorMessage(res, fallback) {
        try {
            const body = await res.json();
            return body && body.messaggio ? body.messaggio : fallback;
        } catch {
            return fallback;
        }
    }

    // La colonna data_fine è NOT NULL per gli assegnamenti task: usiamo una data lontana
    // (o la scadenza del task, se presente) come "nessuna scadenza".
    const FAR_FUTURE_DATE = '2099-12-31';

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

    async function apiCompleteTask(id) {
        const currentRes = await Session.authFetch(`${BASE_URL}/attivita/${id}`);
        if (!currentRes.ok) throw new Error(`Errore API: ${currentRes.status}`);
        const current = await currentRes.json();
        current.stato = 'completato';

        const res = await Session.authFetch(`${BASE_URL}/attivita/modifica/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(current)
        });
        if (!res.ok) throw new Error(`Errore API: ${res.status}`);
        return res.json();
    }

    /* ──────────────────────────────────────────────────────
       HELPERS
    ────────────────────────────────────────────────────── */

    function formatDateIT(iso) {
        return I18N.formatDate(iso);
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
        calendar: `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
        </svg>`,
        doc: `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm8 0v3a1 1 0 001 1h3l-4-4z" clip-rule="evenodd"/>
        </svg>`,
        stopwatch: `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M10 2a1 1 0 00-1 1v.09A7.002 7.002 0 003 10a7 7 0 1012.874-3.79l.532-.531a1 1 0 10-1.415-1.415l-.53.532A6.967 6.967 0 0011 3.09V3a1 1 0 00-1-1zm0 5a1 1 0 011 1v2.586l1.707 1.707a1 1 0 01-1.414 1.414l-2-2A1 1 0 019 11V8a1 1 0 011-1z" clip-rule="evenodd"/>
        </svg>`,
        clock: `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
        </svg>`,
        folder: `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M2 4a2 2 0 012-2h4.586A2 2 0 0110 2.586L11.414 4H16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V4z"/>
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
       RENDER
    ────────────────────────────────────────────────────── */

    function renderAssigneeChip(a) {
        const initial = initialsFromName(a.name);
        return `
        <div class="assignee-chip">
            <div class="avatar avatar--${a.avatarColor}" style="width:32px;height:32px;font-size:13px;">${initial}</div>
            <span class="assignee-chip__name">${a.name}</span>
            <span class="assignee-chip__dept">${a.department}</span>
        </div>`;
    }

    function renderHistoryItem(h) {
        return `
        <div class="history-item">
            <div class="history-item__left">
                <div class="history-item__body">
                    <div class="history-item__meta">${formatDateIT(h.date)}</div>
                    <div class="history-item__note">${h.note}</div>
                </div>
            </div>
            <div class="history-item__right">
                <span class="history-item__duration">${ICON.clock} ${h.duration}</span>
            </div>
        </div>`;
    }

    function renderTask(task) {
        currentTask = task;
        const main = document.getElementById('main-content');
        const overdue = isOverdue(task.dueDate, task.status);

        // Chi gestisce la task (admin/capoprogetto) ha Modifica/Elimina; un
        // semplice assegnatario non gestore ha solo un modo rapido per segnarla
        // completata, come già avviene nelle card di dashboard.js/attivita-generale.js.
        const canComplete = !task.canManageTasks
            && task.assignees.some(a => a.id === CURRENT_DIPENDENTE_ID)
            && (task.status === 'in corso' || task.status === 'da iniziare');

        const historyEl = task.history.length
            ? `<div class="history-list">${task.history.map(renderHistoryItem).join('')}</div>`
            : `<p class="detail-desc-text">${I18N.t('attivitaDett.nessunaEsecuzione')}</p>`;

        const progettoRowEl = task.project
            ? `<span class="field-label">${I18N.t('field.progetto')}</span>
               <a class="project-link-row" href="progetti-dettaglio.html?id=${task.project.id}">
                   <span class="project-link-row__left">
                       ${ICON.folder}
                       <span class="project-link-row__name">${task.project.name}</span>
                   </span>
                   <span class="badge-status ${STATUS_CLASS[(task.project.status || '').toLowerCase()] || ''}">${translateStatus(task.project.status)}</span>
               </a>`
            : '';

        const createdByRowEl = task.createdBy
            ? `<span class="field-label">${I18N.t('attivitaDett.creataDa')}</span>
               <div class="person-row">
                   <div class="avatar avatar--${task.createdBy.avatarColor}" style="width:28px;height:28px;font-size:12px;">${initialsFromName(task.createdBy.name)}</div>
                   <span class="person-row__name">${task.createdBy.name}</span>
               </div>`
            : '';

        const progressCardEl = task.progress !== null
            ? `<div class="detail-progress-card">
                <div class="detail-progress-card__header">
                    <span class="detail-progress-card__label">${I18N.t('progetti.avanzamento')}</span>
                    <span class="detail-progress-card__value">${task.progress}%</span>
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

        main.innerHTML = `
        <button class="detail-back" type="button" id="back-btn">
            ${ICON.back}
            ${I18N.t('common.back')}
        </button>

        <div class="detail-header">
            <div class="detail-header__left">
                <h1 class="detail-title">${task.title}</h1>
                <div class="detail-badges">
                    <span class="badge-status ${STATUS_CLASS[(task.status || '').toLowerCase()] || ''}">${translateStatus(task.status)}</span>
                    <span class="badge-priority ${PRIORITY_CLASS[(task.priority || '').toLowerCase()] || ''}">${translatePriority(task.priority)}</span>
                    <span class="badge-tag">${translateCategory(task.category)}</span>
                </div>
            </div>
            ${task.canManageTasks ? `
            <div class="detail-header__actions">
                <button class="btn-edit" type="button" id="task-edit-btn">${ICON.edit} ${I18N.t('common.edit')}</button>
                <button class="btn-delete" type="button" id="task-delete-btn">${ICON.trash} ${I18N.t('common.delete')}</button>
            </div>` : canComplete ? `
            <div class="detail-header__actions">
                <button class="btn-complete" type="button" id="task-complete-btn">${I18N.t('common.complete')}</button>
            </div>` : ''}
            ${progressCardEl}
        </div>

        <div class="info-cards-row">
            <div class="info-card">
                <span class="info-card__label">${I18N.t('field.stato')}</span>
                <span class="badge-status ${STATUS_CLASS[(task.status || '').toLowerCase()] || ''}">${translateStatus(task.status)}</span>
            </div>
            <div class="info-card">
                <span class="info-card__label">${I18N.t('field.priorita')}</span>
                <span class="badge-priority ${PRIORITY_CLASS[(task.priority || '').toLowerCase()] || ''}">${translatePriority(task.priority)}</span>
            </div>
            <div class="info-card">
                <span class="info-card__label">${I18N.t('attivitaDett.tempoStimato')}</span>
                <span class="info-card__value">${task.estimatedTime}</span>
            </div>
            <div class="info-card">
                <span class="info-card__label">${I18N.t('attivitaDett.tempoEffettivo')}</span>
                <span class="info-card__value">${task.actualTime}</span>
            </div>
        </div>

        <div class="detail-columns">
            <div class="detail-card">
                <div class="detail-card__header">
                    ${ICON.people}
                    <span class="detail-card__title">${I18N.t('attivitaDett.progettoEAssegnatari')}</span>
                </div>

                ${progettoRowEl}

                <span class="field-label">${I18N.t('attivitaDett.assegnatari')}</span>
                ${task.assignees.length ? task.assignees.map(renderAssigneeChip).join('') : `<p class="detail-desc-text">${I18N.t('attivitaDett.nessunAssegnatario')}</p>`}

                ${createdByRowEl}
            </div>

            <div class="detail-card">
                <div class="detail-card__header">
                    ${ICON.calendar}
                    <span class="detail-card__title">${I18N.t('attivitaDett.dateETempi')}</span>
                </div>
                <div class="date-rows">
                    <div class="date-row">
                        <span class="date-row__label">${I18N.t('field.scadenza')}</span>
                        <span class="date-row__value ${overdue ? 'date-row__value--danger' : ''}">${formatDateIT(task.dueDate)}</span>
                    </div>
                    <div class="date-row">
                        <span class="date-row__label">${ICON.clock} ${I18N.t('attivitaDett.tempoStimato')}</span>
                        <span class="date-row__value">${task.estimatedTime}</span>
                    </div>
                    <div class="date-row">
                        <span class="date-row__label">${ICON.stopwatch} ${I18N.t('attivitaDett.tempoEffettivo')}</span>
                        <span class="date-row__value">${task.actualTime}</span>
                    </div>
                    <hr class="date-rows-divider">
                    <div class="date-row">
                        <span class="date-row__label">${I18N.t('attivitaDett.creataIl')}</span>
                        <span class="date-row__value">${formatDateIT(task.createdAt)}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="detail-card detail-card--full" style="margin-bottom:20px;">
            <div class="detail-card__header">
                ${ICON.doc}
                <span class="detail-card__title">${I18N.t('attivitaDett.descrizione')}</span>
            </div>
            <p class="detail-desc-text">${task.description}</p>
        </div>

        <div class="detail-card detail-card--full">
            <div class="detail-card__header">
                ${ICON.stopwatch}
                <span class="detail-card__title">${I18N.t('attivitaDett.storicoEsecuzioni')}</span>
                <span class="detail-card__count">(${task.history.length})</span>
            </div>
            ${historyEl}
        </div>`;

        document.getElementById('back-btn').addEventListener('click', () => {
            if (document.referrer && new URL(document.referrer).origin === location.origin) {
                history.back();
            } else {
                location.href = 'attivita-generale.html';
            }
        });

        if (task.canManageTasks) {
            document.getElementById('task-edit-btn').addEventListener('click', () => openTaskModal(task));
            document.getElementById('task-delete-btn').addEventListener('click', () => openDeleteModal(task));
        } else if (canComplete) {
            document.getElementById('task-complete-btn').addEventListener('click', onCompleteTask);
        }
    }

    async function onCompleteTask() {
        const btn = document.getElementById('task-complete-btn');
        const original = btn.textContent;
        btn.disabled = true;
        btn.textContent = '…';
        try {
            await apiCompleteTask(currentTask.id);
            await loadTask();
            Toast.success(I18N.t('dashboard.completeSuccess'));
        } catch (err) {
            btn.disabled = false;
            btn.textContent = original;
            Toast.error(err.message || I18N.t('dashboard.completeError'));
            console.error('[onCompleteTask]', err);
        }
    }

    /* ──────────────────────────────────────────────────────
       MODALE — Modifica attività
    ────────────────────────────────────────────────────── */

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

    function openTaskModal(task) {
        document.getElementById('edit-form-error').hidden = true;
        document.getElementById('edit-title').value = task.title;
        document.getElementById('edit-desc').value = task.description || '';
        document.getElementById('edit-priority').value = (task.priority || '').toLowerCase();
        document.getElementById('edit-category').value = (task.category || '').toLowerCase();
        document.getElementById('edit-status').value = (task.status || '').toLowerCase();
        const estimated = minutesToValueUnit(parseMinutes(task.estimatedTime));
        document.getElementById('edit-estimated').value = estimated.value;
        document.getElementById('edit-estimated-unit').value = estimated.unit;
        document.getElementById('edit-due-date').value = task.dueDate || '';

        const assigneeIds = task.assignees.map(a => a.id);
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

        if (payload.estimatedMinutes < 0) {
            errorEl.textContent = I18N.t('attivita.negativeEstimateError');
            errorEl.hidden = false;
            Toast.error(I18N.t('attivita.negativeEstimateError'));
            return;
        }

        saveBtn.disabled = true;
        try {
            await apiUpdateTask(currentTask, payload);
            closeEditModal();
            await loadTask();
            Toast.success(I18N.t('attivitaDett.updatedSuccess'));
        } catch (err) {
            const message = err.message || I18N.t('attivitaDett.updateError');
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

    let taskPendingDelete = null;

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
            Toast.successBeforeNavigate(I18N.t('attivitaDett.deletedSuccess'));
            location.href = `progetti-dettaglio.html?id=${taskPendingDelete.project ? taskPendingDelete.project.id : ''}`;
        } catch (err) {
            const message = err.message || I18N.t('attivitaDett.deleteError');
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

    async function loadTask() {
        const main = document.getElementById('main-content');
        const params = new URLSearchParams(location.search);
        const id = Number(params.get('id'));

        if (!id) {
            main.innerHTML = `<p class="state state--error">${I18N.t('attivitaDett.noneSpecified')}</p>`;
            return;
        }

        try {
            const task = await apiGetTaskDetail(id);
            const role = await myRoleOnProject(task.project ? task.project.id : null);
            task.canManageTasks = role === 'admin' || role === 'teamleader';
            renderTask(task);
        } catch (err) {
            main.innerHTML = `<p class="state state--error">${I18N.t('attivitaDett.notFound')}</p>`;
            console.error('[loadTask]', err);
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
       INIT
    ────────────────────────────────────────────────────── */

    document.addEventListener('DOMContentLoaded', () => {
        Promise.all([loadUser(), loadReferenceData(), loadTask()]);
        document.getElementById('logout-btn').addEventListener('click', Session.logout);
        setupChecklistSearch('edit-assignees-search', 'edit-assignees');

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
            if (!document.getElementById('edit-modal-overlay').hidden) closeEditModal();
            if (!document.getElementById('delete-modal-overlay').hidden) closeDeleteModal();
        });
    });

    document.addEventListener('i18n:change', () => {
        loadUser();
        if (currentTask) renderTask(currentTask);
    });

})();
