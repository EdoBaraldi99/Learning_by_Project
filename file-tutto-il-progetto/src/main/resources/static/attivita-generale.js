(() => {
    'use strict';

    /* ________________________________________________________________________________________________________________________

    STRATO DI ACCESSO API — chiama il backend reale (Spring Boot).
    _________________________________________________________________________________________________________________________
    Endpoint usati:
        GET     /dipendenti/{id}
        GET     /dipendenti/lista
        GET     /progetti/lista
        GET     /attivita/lista
        GET     /attivita/{id}
        POST    /attivita/crea
        PATCH   /attivita/modifica/{id}
        DELETE  /attivita/elimina/{id}
        GET     /assegnati/attivita/{id}
        POST    /assegnati
        DELETE  /assegnati/{id}

    NOTE SUI LIMITI ATTUALI DEL BACKEND:
    - Non c'è un endpoint di ricerca lato server: si scarica /attivita/lista e si
      filtra per assegnatario/progetto e per testo lato client.
    - "progress" non esiste sul backend: viene dedotto dallo stato (Completato → 100,
      Da iniziare → 0, altrimenti sconosciuto → nessuna progress bar mostrata).
    - Ambito visibilità: Admin vede tutte le attività di tutti i progetti;
      un dipendente con ruolo diverso da "Dipendente" su almeno un progetto (TeamLeader)
      vede le attività di TUTTI i progetti che gestisce (non solo quelle assegnate a sé);
      un Dipendente "puro" (nessun progetto gestito) vede solo le attività assegnate a sé,
      comportamento invariato rispetto a prima.
    - Stessa regola determina anche i permessi di scrittura (Crea/Modifica/Elimina):
      chi vede l'elenco esteso (Admin o TeamLeader) può gestire le attività mostrate;
      il Dipendente puro resta in sola lettura con il bottone rapido "Completa".
    ────────────────────────────────────────────────────── */

    const BASE_URL = '';
    const CURRENT_USER = Session.requireLogin();
    const CURRENT_DIPENDENTE_ID = CURRENT_USER ? CURRENT_USER.idDipendente : null;
    const IS_ADMIN = !!(CURRENT_USER && CURRENT_USER.isAdmin);

    const AVATAR_COLORS = ['blue', 'green', 'orange', 'red', 'purple']; // 'slate' escluso: riservato ai placeholder senza persona assegnata
    function colorForName(name) {
        let hash = 0;
        for (let i = 0; i < (name || '').length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
        return AVATAR_COLORS[hash % AVATAR_COLORS.length];
    }

    async function parseErrorMessage(res, fallback) {
        try {
            const body = await res.json();
            return body && body.messaggio ? body.messaggio : fallback;
        } catch {
            return fallback;
        }
    }

    // La colonna data_fine è NOT NULL per gli assegnamenti task: usiamo una data lontana come "nessuna scadenza".
    const FAR_FUTURE_DATE = '2099-12-31';

    async function apiGetCurrentUser() {
        const res = await Session.authFetch(`${BASE_URL}/dipendenti/${CURRENT_DIPENDENTE_ID}`);
        if (!res.ok) throw new Error(`Errore API: ${res.status}`);
        const d = await res.json();
        const name = `${d.nome} ${d.cognome}`.trim();
        return {
            name,
            role: d.area,
            isAdmin: !!d.isAdmin,
            initials: (d.nome || '?').trim().charAt(0).toUpperCase() + (d.cognome || '').trim().charAt(0).toUpperCase(),
            avatarColor: colorForName(name)
        };
    }

    async function apiGetProjects() {
        const res = await Session.authFetch(`${BASE_URL}/progetti/lista`);
        if (!res.ok) throw new Error(`Errore API: ${res.status}`);
        return res.json();
    }

    async function apiGetDipendenti() {
        const res = await Session.authFetch(`${BASE_URL}/dipendenti/lista`);
        if (!res.ok) throw new Error(`Errore API: ${res.status}`);
        return res.json();
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
        const assignees = (raw.assegnati || [])
            .filter(a => a.dipendente)
            .map(a => ({ id: a.dipendente.idDipendente, name: `${a.dipendente.nome} ${a.dipendente.cognome}`.trim() }));
        return {
            id: raw.idTask,
            title: raw.titolo,
            isRecurring: false, // il backend non modella ancora la ricorrenza
            project: raw.progetto ? raw.progetto.nome : '—',
            projectId: raw.progetto ? raw.progetto.idProgetto : null,
            assignees,
            assignee: assignees.map(a => a.name).join(', '),
            description: raw.descrizione,
            dueDate: raw.scadenza,
            estimatedTime: raw.tempoStimato,
            category: raw.tipologia,
            priority: raw.priorita,
            status: raw.stato,
            progress: raw.stato === 'completato' ? 100 : (raw.stato === 'da iniziare' ? 0 : null)
        };
    }

    // Ruolo effettivo sulla pagina: 'admin' (vede/gestisce tutto), 'manager' (vede/gestisce
    // solo i progetti su cui ha un ruolo diverso da 'dipendente'), 'employee' (sola lettura,
    // solo le attività assegnate a sé) — dedotto da Associato.ruolo sui progetti, coerente
    // con la stessa regola usata in progetti-dettaglio.js.
    function deriveScope(projects) {
        if (IS_ADMIN) return { role: 'admin', managedProjectIds: null };
        const managedProjectIds = projects
            .filter(p => (p.associati || []).some(a =>
                a.dipendente && a.dipendente.idDipendente === CURRENT_DIPENDENTE_ID && (a.ruolo || '').toLowerCase() !== 'dipendente'
            ))
            .map(p => p.idProgetto);
        return managedProjectIds.length > 0
            ? { role: 'manager', managedProjectIds }
            : { role: 'employee', managedProjectIds: [] };
    }

    async function apiGetTasks() {
        const [tasksRes, projects] = await Promise.all([
            Session.authFetch(`${BASE_URL}/attivita/lista`),
            apiGetProjects()
        ]);
        if (!tasksRes.ok) throw new Error(`Errore API: ${tasksRes.status}`);
        const raw = await tasksRes.json();

        const scope = deriveScope(projects);
        let tasks = raw.map(normalizeTask);
        if (scope.role === 'admin') {
            // nessun filtro
        } else if (scope.role === 'manager') {
            tasks = tasks.filter(t => scope.managedProjectIds.includes(t.projectId));
        } else {
            tasks = tasks.filter(t => t.assignees.some(a => a.id === CURRENT_DIPENDENTE_ID));
        }

        return { tasks, scope, projects };
    }

    async function apiCreateTask(payload) {
        const body = {
            titolo: payload.title,
            descrizione: payload.description,
            dataAssegnazione: new Date().toISOString().slice(0, 10),
            scadenza: payload.dueDate || FAR_FUTURE_DATE,
            tempoStimato: formatMinutes(Number(payload.estimatedMinutes) || 0),
            stato: payload.status,
            tipologia: payload.category,
            priorita: payload.priority,
            idProgetto: payload.projectId ? Number(payload.projectId) : null
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
            priorita: payload.priority,
            idProgetto: payload.projectId ? Number(payload.projectId) : null
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
       STATO LOCALE
    ────────────────────────────────────────────────────── */

    let allTasks = [];
    let allProjects = [];
    let allDipendenti = [];
    let canManage = false;
    let currentQuery = '';
    let currentStatusFilter = '';
    let currentPriorityFilter = '';
    let editingTaskId = null;

    /* ──────────────────────────────────────────────────────
       HELPERS
    ────────────────────────────────────────────────────── */

    function formatDateIT(iso) {
        return I18N.formatDate(iso);
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
        recurring: `<svg class="task-title__icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
        </svg>`,

        calendar: `<svg class="meta-icon meta-icon--calendar" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
        </svg>`,

        clock: `<svg class="meta-icon meta-icon--clock" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
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

    function renderTaskCard(task) {
        const dateEl = task.dueDate
            ? `<span class="task-meta__item task-meta__item--date">
                ${ICON.calendar}
                <span>${formatDateIT(task.dueDate)}</span>
               </span>`
            : '';

        let actionsEl;
        if (canManage) {
            actionsEl = `
            <div class="task-card__badges-col">
                <div class="task-card__badges">
                    <span class="badge-priority ${PRIORITY_CLASS[(task.priority || '').toLowerCase()] || ''}">${translatePriority(task.priority)}</span>
                    <span class="badge-status ${STATUS_CLASS[(task.status || '').toLowerCase()] || ''}">${translateStatus(task.status)}</span>
                    <button class="btn-edit" type="button" data-edit-id="${task.id}">${ICON.edit} ${I18N.t('common.edit')}</button>
                </div>
                <button class="icon-btn--delete" type="button" data-delete-id="${task.id}" aria-label="${I18N.t('attivita.deleteAria')}">${ICON.trash}</button>
            </div>`;
        } else {
            const completeBtnEl = (task.status === 'in corso' || task.status === 'da iniziare')
                ? `<button class="btn-complete" data-task-id="${task.id}" type="button">${I18N.t('common.complete')}</button>`
                : '';
            actionsEl = `
            <div class="task-card__badges">
                <span class="badge-priority ${PRIORITY_CLASS[(task.priority || '').toLowerCase()] || ''}">${translatePriority(task.priority)}</span>
                <span class="badge-status ${STATUS_CLASS[(task.status || '').toLowerCase()] || ''}">${translateStatus(task.status)}</span>
                ${completeBtnEl}
            </div>`;
        }

        const progressEl = task.progress !== null
            ? `<div class="task-card__action">
                <div class="progress">
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
                </div>
               </div>`
            : '';

        return `
        <article class="task-card" data-id="${task.id}">
            <div class="task-card__inner">
                <div class="task-card__body">
                    <div class="task-card__header">
                        <h3 class="task-card__title">
                            ${task.title}
                            ${task.isRecurring ? ICON.recurring : ''}
                        </h3>
                        ${actionsEl}
                    </div>
                    <p class="task-card__meta-line">
                        ${task.project} <span class="meta-sep">•</span> ${task.assignee || '—'}
                    </p>
                    <p class="task-card__desc">${task.description}</p>
                    <div class="task-meta">
                        ${dateEl}
                        <span class="task-meta__item">
                            ${ICON.clock}
                            <span>${task.estimatedTime}</span>
                        </span>
                        <span class="task-meta__tag">${translateCategory(task.category)}</span>
                    </div>
                </div>
                ${progressEl}
            </div>
        </article>`;
    }

    function renderTasks(tasks) {
        const list = document.getElementById('task-list');

        if (tasks.length === 0) {
            list.innerHTML = `<p class="state state--empty">${I18N.t('attivita.noneFound')}</p>`;
            return;
        }

        list.innerHTML = tasks.map(renderTaskCard).join('');

        list.querySelectorAll('.task-card').forEach(card => {
            card.addEventListener('click', () => {
                location.href = `attivita-dettaglio.html?id=${card.dataset.id}`;
            });
        });

        if (canManage) {
            list.querySelectorAll('[data-edit-id]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const task = allTasks.find(t => t.id === Number(btn.dataset.editId));
                    if (task) openTaskModal(task);
                });
            });

            list.querySelectorAll('[data-delete-id]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const task = allTasks.find(t => t.id === Number(btn.dataset.deleteId));
                    if (task) openDeleteModal(task);
                });
            });
        } else {
            list.querySelectorAll('.btn-complete').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const id = Number(btn.dataset.taskId);
                    btn.disabled = true;
                    btn.textContent = '…';
                    try {
                        await apiCompleteTask(id);
                        await loadTasks();
                        Toast.success(I18N.t('dashboard.completeSuccess'));
                    } catch (err) {
                        btn.disabled = false;
                        btn.textContent = I18N.t('common.complete');
                        Toast.error(err.message || I18N.t('dashboard.completeError'));
                    }
                });
            });
        }
    }

    /* ──────────────────────────────────────────────────────
       FILTRI (stato + priorità + ricerca)
    ────────────────────────────────────────────────────── */

    function applyFilters() {
        const q = currentQuery.toLowerCase();
        let tasks = allTasks;
        if (q) {
            tasks = tasks.filter(t =>
                t.title.toLowerCase().includes(q) ||
                (t.description || '').toLowerCase().includes(q) ||
                t.project.toLowerCase().includes(q) ||
                (t.category || '').toLowerCase().includes(q)
            );
        }
        if (currentStatusFilter) tasks = tasks.filter(t => (t.status || '').toLowerCase() === currentStatusFilter);
        if (currentPriorityFilter) tasks = tasks.filter(t => (t.priority || '').toLowerCase() === currentPriorityFilter);
        renderTasks(tasks);
    }

    function initFilterDropdown(containerId, btnId, menuId, labelId, datasetKey, onChange) {
        const filter = document.getElementById(containerId);
        const btn = document.getElementById(btnId);
        const menu = document.getElementById(menuId);

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = !menu.hidden;
            menu.hidden = isOpen;
            filter.classList.toggle('is-open', !isOpen);
            btn.setAttribute('aria-expanded', String(!isOpen));
        });

        menu.querySelectorAll('.status-filter__option').forEach(opt => {
            opt.addEventListener('click', () => {
                const value = opt.dataset[datasetKey];
                const translate = datasetKey === 'priority' ? translatePriority : translateStatus;
                document.getElementById(labelId).textContent = value ? translate(value) : opt.textContent.trim();
                menu.querySelectorAll('.status-filter__option').forEach(o => o.classList.toggle('is-selected', o === opt));
                menu.hidden = true;
                filter.classList.remove('is-open');
                btn.setAttribute('aria-expanded', 'false');
                onChange(value);
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
       MODALE — Crea / Modifica attività
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

    // L'elenco progetti selezionabili nella modale è limitato ai soli progetti gestiti
    // (Admin: tutti; TeamLeader: solo quelli su cui ha un ruolo diverso da 'dipendente').
    function selectableProjects() {
        if (IS_ADMIN) return allProjects;
        return allProjects.filter(p => (p.associati || []).some(a =>
            a.dipendente && a.dipendente.idDipendente === CURRENT_DIPENDENTE_ID && (a.ruolo || '').toLowerCase() !== 'dipendente'
        ));
    }

    function openTaskModal(task) {
        editingTaskId = task ? task.id : null;
        document.getElementById('edit-modal-title').textContent = task ? I18N.t('progettiDett.editTaskTitle') : I18N.t('progettiDett.newTaskModalTitle');
        document.getElementById('edit-form-error').hidden = true;

        document.getElementById('edit-title').value = task ? task.title : '';
        document.getElementById('edit-desc').value = task ? (task.description || '') : '';
        document.getElementById('edit-priority').value = task ? (task.priority || '').toLowerCase() : 'media';
        document.getElementById('edit-category').value = task ? (task.category || '').toLowerCase() : 'sviluppo';
        document.getElementById('edit-status').value = task ? (task.status || '').toLowerCase() : 'da iniziare';
        document.getElementById('edit-estimated').value = task ? parseMinutes(task.estimatedTime) : '';
        document.getElementById('edit-due-date').value = task ? (task.dueDate || '') : '';

        const projects = selectableProjects();
        const projectSelect = document.getElementById('edit-project');
        projectSelect.innerHTML = projects.map(p =>
            `<option value="${p.idProgetto}" ${task && p.idProgetto === task.projectId ? 'selected' : ''}>${p.nome}</option>`
        ).join('');

        const assigneeIds = task ? task.assignees.map(a => a.id) : [];
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
            projectId: document.getElementById('edit-project').value,
            priority: document.getElementById('edit-priority').value,
            category: document.getElementById('edit-category').value,
            status: document.getElementById('edit-status').value,
            estimatedMinutes: document.getElementById('edit-estimated').value,
            dueDate: document.getElementById('edit-due-date').value || null,
            assigneeIds: getCheckedValues('edit-assignees')
        };

        saveBtn.disabled = true;
        try {
            const isEditing = !!editingTaskId;
            if (isEditing) {
                const task = allTasks.find(t => t.id === editingTaskId);
                await apiUpdateTask(task, payload);
            } else {
                await apiCreateTask(payload);
            }
            closeEditModal();
            await loadTasks();
            Toast.success(isEditing ? I18N.t('attivita.taskUpdatedSuccess') : I18N.t('attivita.taskCreatedSuccess'));
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
            closeDeleteModal();
            await loadTasks();
            Toast.success(I18N.t('attivita.taskDeletedSuccess'));
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

    async function loadTasks() {
        const list = document.getElementById('task-list');
        try {
            const result = await apiGetTasks();
            allTasks = result.tasks;
            allProjects = result.projects;
            canManage = result.scope.role !== 'employee';
            document.getElementById('new-task-btn').hidden = !canManage;
            applyFilters();
        } catch (err) {
            list.innerHTML = `<p class="state state--error">${I18N.t('common.errorLoadingRetry')}</p>`;
            console.error('[loadTasks]', err);
        }
    }

    async function loadDipendenti() {
        try {
            allDipendenti = await apiGetDipendenti();
        } catch (err) {
            console.error('[loadDipendenti]', err);
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
            applyFilters();
        }, 280);
    }

    /* ──────────────────────────────────────────────────────
       INIT
    ────────────────────────────────────────────────────── */

    document.addEventListener('DOMContentLoaded', async () => {
        await Promise.all([loadUser(), loadDipendenti(), loadTasks()]);
        document.getElementById('search-input').addEventListener('input', onSearch);
        document.getElementById('logout-btn').addEventListener('click', Session.logout);
        document.getElementById('new-task-btn').addEventListener('click', () => openTaskModal(null));

        initFilterDropdown('status-filter', 'status-filter-btn', 'status-filter-menu', 'status-filter-label', 'status', (value) => {
            currentStatusFilter = value;
            applyFilters();
        });
        initFilterDropdown('priority-filter', 'priority-filter-btn', 'priority-filter-menu', 'priority-filter-label', 'priority', (value) => {
            currentPriorityFilter = value;
            applyFilters();
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
            if (!document.getElementById('edit-modal-overlay').hidden) closeEditModal();
            if (!document.getElementById('delete-modal-overlay').hidden) closeDeleteModal();
        });
    });

    document.addEventListener('i18n:change', () => {
        loadUser();
        applyFilters();
    });

})();
