(() => {
    'use strict';

    /* ________________________________________________________________________________________________________________________

    STRATO DI ACCESSO API — chiama il backend reale (Spring Boot).
    _________________________________________________________________________________________________________________________
    Endpoint usati:
        GET    /dipendenti/{id}
        GET    /dipendenti/lista   (solo vista Admin — conteggio "Totale utenti")
        GET    /attivita/lista
        GET    /attivita/{id}
        PATCH  /attivita/modifica/{id}
        GET    /progetti/lista     (solo vista Admin — "Progetti Attivi")

    NOTE:
    - L'utente loggato viene letto dalla sessione (session.js), popolata da /auth/login.
    - Le statistiche e le liste di questa pagina non hanno un endpoint dedicato:
      vengono derivate lato client da /attivita/lista (+ /dipendenti/lista e
      /progetti/lista per la vista Admin).
    - Due viste diverse in base a Dipendente.isAdmin: un utente normale vede solo
      le proprie attività ("Le Mie Attività"); un amministratore vede una
      panoramica di sistema (utenti/progetti/attività totali, attività recenti
      su tutti i progetti, avanzamento dei progetti attivi) — vedi PNG pagine/admin/dashboard.
    ────────────────────────────────────────────────────── */

    const BASE_URL = '';
    const CURRENT_USER = Session.requireLogin();
    const CURRENT_DIPENDENTE_ID = CURRENT_USER ? CURRENT_USER.idDipendente : null;

    const AVATAR_COLORS = ['blue', 'green', 'orange', 'red', 'purple']; // 'slate' escluso: riservato ai placeholder senza persona assegnata
    function colorForName(name) {
        let hash = 0;
        for (let i = 0; i < (name || '').length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
        return AVATAR_COLORS[hash % AVATAR_COLORS.length];
    }

    async function apiGetCurrentUser() {
        const res = await Session.authFetch(`${BASE_URL}/dipendenti/${CURRENT_DIPENDENTE_ID}`);
        if (!res.ok) throw new Error(`Errore API: ${res.status}`);
        const d = await res.json();
        const name = `${d.nome} ${d.cognome}`.trim();
        return {
            id: d.idDipendente,
            name,
            role: d.area,
            isAdmin: !!d.isAdmin,
            initials: (d.nome || '?').trim().charAt(0).toUpperCase() + (d.cognome || '').trim().charAt(0).toUpperCase(),
            avatarColor: colorForName(name)
        };
    }

    function normalizeTask(raw) {
        return {
            id: raw.idTask,
            title: raw.titolo,
            isRecurring: false, // il backend non modella ancora la ricorrenza
            project: raw.progetto ? raw.progetto.nome : '—',
            assignee: (raw.assegnati || [])
                .map(a => a.dipendente ? `${a.dipendente.nome} ${a.dipendente.cognome}`.trim() : null)
                .filter(Boolean)
                .join(', '),
            description: raw.descrizione,
            dueDate: raw.scadenza,
            estimatedTime: raw.tempoStimato,
            category: raw.tipologia,
            priority: raw.priorita,
            status: raw.stato,
            createdAt: raw.dataAssegnazione
        };
    }

    async function apiGetAllTasks() {
        const res = await Session.authFetch(`${BASE_URL}/attivita/lista`);
        if (!res.ok) throw new Error(`Errore API: ${res.status}`);
        return res.json();
    }

    async function apiGetMyTasks() {
        const tasks = await apiGetAllTasks();
        return tasks
            .filter(t => (t.assegnati || []).some(a => a.dipendente && a.dipendente.idDipendente === CURRENT_DIPENDENTE_ID))
            .map(normalizeTask);
    }

    async function apiGetDipendenti() {
        const res = await Session.authFetch(`${BASE_URL}/dipendenti/lista`);
        if (!res.ok) throw new Error(`Errore API: ${res.status}`);
        return res.json();
    }

    function normalizeProjectSummary(raw) {
        const tasks = raw.attivita || [];
        const tasksTotal = tasks.length;
        const tasksCompleted = tasks.filter(t => t.stato === 'completato').length;
        return {
            id: raw.idProgetto,
            name: raw.nome,
            status: raw.stato,
            tasksTotal,
            tasksCompleted,
            progress: tasksTotal ? Math.round((tasksCompleted / tasksTotal) * 100) : 0
        };
    }

    async function apiGetAllProjects() {
        const res = await Session.authFetch(`${BASE_URL}/progetti/lista`);
        if (!res.ok) throw new Error(`Errore API: ${res.status}`);
        return res.json();
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

    function isOverdue(task) {
        if (!task.dueDate || task.status === 'completato') return false;
        return new Date(task.dueDate + 'T00:00:00') < new Date(new Date().toDateString());
    }

    function computeStats(tasks) {
        return {
            todo: tasks.filter(t => t.status === 'da iniziare').length,
            inProgress: tasks.filter(t => t.status === 'in corso').length,
            completed: tasks.filter(t => t.status === 'completato').length,
            overdue: tasks.filter(isOverdue).length
        };
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
        checkSquare: `<svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <rect x="3" y="3" width="14" height="14" rx="3" stroke="currentColor" stroke-width="1.6"/>
            <path d="M6.5 10.2l2.2 2.2 4.8-5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,
        clockOutline: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden="true">
            <circle cx="10" cy="10" r="7.25" stroke-width="1.6"/>
            <path d="M10 6v4l2.5 2" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,
        checkCircle: `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd"/>
        </svg>`,
        calendarSolid: `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
        </svg>`,
        people: `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M10 9a4 4 0 100-8 4 4 0 000 8zM10 11c-3.87 0-7 2.239-7 5v1a1 1 0 001 1h12a1 1 0 001-1v-1c0-2.761-3.13-5-7-5z"/>
        </svg>`,
        folder: `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M2 4a2 2 0 012-2h4.586A2 2 0 0110 2.586L11.414 4H16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V4z"/>
        </svg>`,
        alert: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden="true">
            <circle cx="10" cy="10" r="7.25" stroke-width="1.6"/>
            <path d="M10 6.5v4" stroke-width="1.6" stroke-linecap="round"/>
            <circle cx="10" cy="13.5" r="0.9" fill="currentColor" stroke="none"/>
        </svg>`
    };

    /* ──────────────────────────────────────────────────────
       RENDER
    ────────────────────────────────────────────────────── */

    function renderStatCards(stats) {
        const el = document.getElementById('stat-cards');
        el.innerHTML = `
        <div class="stat-card">
            <div class="stat-card__header">
                <span class="stat-card__label">${I18N.t('dashboard.statTodo')}</span>
                ${ICON.checkSquare.replace('<svg ', '<svg class="stat-card__icon stat-card__icon--muted" ')}
            </div>
            <span class="stat-card__value">${stats.todo}</span>
        </div>
        <div class="stat-card">
            <div class="stat-card__header">
                <span class="stat-card__label">${I18N.t('dashboard.statInProgress')}</span>
                ${ICON.clockOutline.replace('<svg ', '<svg class="stat-card__icon stat-card__icon--orange" ')}
            </div>
            <span class="stat-card__value">${stats.inProgress}</span>
        </div>
        <div class="stat-card">
            <div class="stat-card__header">
                <span class="stat-card__label">${I18N.t('dashboard.statCompleted')}</span>
                ${ICON.checkCircle.replace('<svg ', '<svg class="stat-card__icon stat-card__icon--green" ')}
            </div>
            <span class="stat-card__value">${stats.completed}</span>
        </div>
        <div class="stat-card">
            <div class="stat-card__header">
                <span class="stat-card__label">${I18N.t('dashboard.statOverdue')}</span>
                ${ICON.calendarSolid.replace('<svg ', '<svg class="stat-card__icon stat-card__icon--red" ')}
            </div>
            <span class="stat-card__value stat-card__value--danger">${stats.overdue}</span>
        </div>`;
    }

    function renderAdminStatCards(stats) {
        const el = document.getElementById('stat-cards');
        el.innerHTML = `
        <div class="stat-card">
            <div class="stat-card__header">
                <span class="stat-card__label">${I18N.t('dashboard.statTotalUsers')}</span>
                ${ICON.people.replace('<svg ', '<svg class="stat-card__icon stat-card__icon--muted" ')}
            </div>
            <span class="stat-card__value">${stats.totalUsers}</span>
        </div>
        <div class="stat-card">
            <div class="stat-card__header">
                <span class="stat-card__label">${I18N.t('dashboard.statActiveProjects')}</span>
                ${ICON.folder.replace('<svg ', '<svg class="stat-card__icon stat-card__icon--muted" ')}
            </div>
            <span class="stat-card__value">${stats.activeProjects}<span style="color:var(--text-muted); font-weight:500; font-size:16px;">/${stats.totalProjects}</span></span>
        </div>
        <div class="stat-card">
            <div class="stat-card__header">
                <span class="stat-card__label">${I18N.t('dashboard.statActiveTasks')}</span>
                ${ICON.checkSquare.replace('<svg ', '<svg class="stat-card__icon stat-card__icon--green" ')}
            </div>
            <span class="stat-card__value">${stats.activeTasks}<span style="color:var(--text-muted); font-weight:500; font-size:16px;">/${stats.totalTasks}</span></span>
        </div>
        <div class="stat-card">
            <div class="stat-card__header">
                <span class="stat-card__label">${I18N.t('dashboard.statOverdue')}</span>
                ${ICON.alert.replace('<svg ', '<svg class="stat-card__icon stat-card__icon--red" ')}
            </div>
            <span class="stat-card__value stat-card__value--danger">${stats.overdueTasks}</span>
        </div>`;
    }

    function renderRecentTasks(tasks) {
        const el = document.getElementById('recent-tasks');
        if (!tasks.length) {
            el.innerHTML = `<p class="state state--empty">${I18N.t('dashboard.noRecentTasks')}</p>`;
            return;
        }
        el.innerHTML = tasks.map(t => `
            <div class="recent-task-row">
                <div>
                    <div class="recent-task-row__title">${t.title}</div>
                    <div class="recent-task-row__meta">${t.project} • ${t.assignee || '—'}</div>
                </div>
                <div class="recent-task-row__badges">
                    <span class="badge-status ${STATUS_CLASS[(t.status || '').toLowerCase()] || ''}">${translateStatus(t.status)}</span>
                    <span class="badge-priority ${PRIORITY_CLASS[(t.priority || '').toLowerCase()] || ''}">${translatePriority(t.priority)}</span>
                </div>
            </div>`).join('');

        el.querySelectorAll('.recent-task-row').forEach((row, i) => {
            row.style.cursor = 'pointer';
            row.addEventListener('click', () => {
                location.href = `attivita-dettaglio.html?id=${tasks[i].id}`;
            });
        });
    }

    function renderActiveProjects(projects) {
        const el = document.getElementById('active-projects');
        if (!projects.length) {
            el.innerHTML = `<p class="state state--empty">${I18N.t('dashboard.noActiveProjects')}</p>`;
            return;
        }
        el.innerHTML = projects.map(p => `
            <div class="project-mini" data-id="${p.id}" style="cursor:pointer;">
                <div class="project-mini__header">
                    <span class="project-mini__title">${p.name}</span>
                    <span class="project-mini__value">${p.progress}%</span>
                </div>
                <div class="progress__track"
                     role="progressbar"
                     aria-valuenow="${p.progress}"
                     aria-valuemin="0"
                     aria-valuemax="100"
                     aria-label="${I18N.t('dashboard.progressAria', {percent: p.progress})}">
                    <div class="progress__fill" style="width:${p.progress}%"></div>
                </div>
                <div class="project-mini__caption">${I18N.t('dashboard.tasksCompletedCaption', {completed: p.tasksCompleted, total: p.tasksTotal})}</div>
            </div>`).join('');

        el.querySelectorAll('.project-mini').forEach(card => {
            card.addEventListener('click', () => {
                location.href = `progetti-dettaglio.html?id=${card.dataset.id}`;
            });
        });
    }

    function renderTaskCard(task) {
        const dateEl = task.dueDate
            ? `<span class="task-meta__item task-meta__item--date">
                ${ICON.calendar}
                <span>${formatDateIT(task.dueDate)}</span>
               </span>`
            : '';

        return `
        <article class="task-card" data-id="${task.id}">
            <div class="task-card__header">
                <h3 class="task-card__title">
                    ${task.title}
                    ${task.isRecurring ? ICON.recurring : ''}
                </h3>
                <div class="task-card__badges">
                    <span class="badge-priority ${PRIORITY_CLASS[(task.priority || '').toLowerCase()] || ''}">${translatePriority(task.priority)}</span>
                    <span class="badge-status ${STATUS_CLASS[(task.status || '').toLowerCase()] || ''}">${translateStatus(task.status)}</span>
                    <button class="btn-complete" data-task-id="${task.id}" type="button">${I18N.t('common.complete')}</button>
                </div>
            </div>
            <p class="task-card__meta-line">
                ${task.project} <span class="meta-sep">•</span> ${task.assignee}
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
        </article>`;
    }

    function renderActiveTasks(tasks) {
        const list = document.getElementById('active-task-list');

        if (tasks.length === 0) {
            list.innerHTML = `<p class="state state--empty">${I18N.t('dashboard.noActiveTasksNow')}</p>`;
            return;
        }

        list.innerHTML = tasks.map(renderTaskCard).join('');

        list.querySelectorAll('.task-card').forEach(card => {
            card.addEventListener('click', () => {
                location.href = `attivita-dettaglio.html?id=${card.dataset.id}`;
            });
        });

        list.querySelectorAll('.btn-complete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const id = Number(btn.dataset.taskId);
                btn.disabled = true;
                btn.textContent = '…';
                try {
                    await apiCompleteTask(id);
                    await refreshTasks();
                    Toast.success(I18N.t('dashboard.completeSuccess'));
                } catch (err) {
                    btn.disabled = false;
                    btn.textContent = I18N.t('common.complete');
                    Toast.error(err.message || I18N.t('dashboard.completeError'));
                    console.error('[completeTask]', err);
                }
            });
        });
    }

    /* ──────────────────────────────────────────────────────
       DATA LOADING
    ────────────────────────────────────────────────────── */

    async function refreshTasks() {
        const statsEl = document.getElementById('stat-cards');
        const bodyEl = document.getElementById('dashboard-body');
        bodyEl.innerHTML = `
        <section class="active-tasks-card" aria-label="${I18N.t('dashboard.myActiveTasks')}">
            <h2 class="active-tasks-card__title">${I18N.t('dashboard.myActiveTasks')}</h2>
            <div class="task-list" id="active-task-list">
                <p class="state state--loading">${I18N.t('common.loading')}</p>
            </div>
        </section>`;
        try {
            const tasks = await apiGetMyTasks();
            renderStatCards(computeStats(tasks));
            // "Attive" = non ancora completate (da iniziare, in corso, in pausa,
            // bloccato): prima veniva mostrato solo lo stato "in corso", per cui
            // un'attività appena creata (stato di default "da iniziare") restava
            // invisibile in questa lista pur comparendo nel conteggio "Da fare".
            renderActiveTasks(tasks.filter(t => t.status !== 'completato'));
        } catch (err) {
            statsEl.innerHTML = `<p class="state state--error">${I18N.t('common.errorLoadingStats')}</p>`;
            document.getElementById('active-task-list').innerHTML = `<p class="state state--error">${I18N.t('common.errorLoadingRetry')}</p>`;
            console.error('[refreshTasks]', err);
        }
    }

    async function loadAdminDashboard() {
        const statsEl = document.getElementById('stat-cards');
        const bodyEl = document.getElementById('dashboard-body');
        bodyEl.innerHTML = `
        <div class="dashboard-columns">
            <section class="panel-card" aria-label="${I18N.t('dashboard.recentTasks')}">
                <h2 class="panel-card__title">${I18N.t('dashboard.recentTasks')}</h2>
                <div id="recent-tasks"><p class="state state--loading">${I18N.t('common.loading')}</p></div>
            </section>
            <section class="panel-card" aria-label="${I18N.t('dashboard.activeProjects')}">
                <h2 class="panel-card__title">${I18N.t('dashboard.activeProjects')}</h2>
                <div id="active-projects"><p class="state state--loading">${I18N.t('common.loading')}</p></div>
            </section>
        </div>`;

        try {
            const [dipendenti, rawTasks, rawProjects] = await Promise.all([
                apiGetDipendenti(), apiGetAllTasks(), apiGetAllProjects()
            ]);

            const tasks = rawTasks.map(normalizeTask);
            const projects = rawProjects.map(normalizeProjectSummary);
            const activeProjects = projects.filter(p => (p.status || '').toLowerCase() !== 'completato');
            const activeTasks = tasks.filter(t => t.status === 'in corso');
            const overdueTasks = tasks.filter(isOverdue);

            renderAdminStatCards({
                totalUsers: dipendenti.length,
                activeProjects: activeProjects.length,
                totalProjects: projects.length,
                activeTasks: activeTasks.length,
                totalTasks: tasks.length,
                overdueTasks: overdueTasks.length
            });

            const recent = tasks
                .slice()
                .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
                .slice(0, 5);
            renderRecentTasks(recent);
            renderActiveProjects(activeProjects.slice(0, 5));
        } catch (err) {
            statsEl.innerHTML = `<p class="state state--error">${I18N.t('common.errorLoadingStats')}</p>`;
            bodyEl.innerHTML = `<p class="state state--error">${I18N.t('common.errorLoading')}</p>`;
            console.error('[loadAdminDashboard]', err);
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
            const titleEl = document.getElementById('page-header-title');
            const subtitleEl = document.getElementById('page-header-subtitle');
            if (user.isAdmin) {
                if (titleEl) titleEl.textContent = I18N.t('dashboard.titleAdmin');
                if (subtitleEl) subtitleEl.textContent = I18N.t('dashboard.subtitleAdmin');
            } else {
                if (titleEl) titleEl.textContent = I18N.t('dashboard.titleUser');
                if (subtitleEl) subtitleEl.textContent = I18N.t('dashboard.subtitleUser', {name: user.name});
            }
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
        const isAdmin = !!(CURRENT_USER && CURRENT_USER.isAdmin);
        Promise.all([loadUser(), isAdmin ? loadAdminDashboard() : refreshTasks()]);
        document.getElementById('logout-btn').addEventListener('click', Session.logout);
    });

    document.addEventListener('i18n:change', () => {
        const isAdmin = !!(CURRENT_USER && CURRENT_USER.isAdmin);
        loadUser();
        isAdmin ? loadAdminDashboard() : refreshTasks();
    });

})();
