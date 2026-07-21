(() => {
    'use strict';

    /* ________________________________________________________________________________________________________________________

    STRATO DI ACCESSO API — chiama il backend reale (Spring Boot).
    _________________________________________________________________________________________________________________________
    Endpoint usati:
        GET   /progetti/lista
        GET   /dipendenti/{id}
        GET   /associati        (per contare i membri di ogni progetto e filtrare per utente)

    NOTE SUI LIMITI ATTUALI DEL BACKEND:
    - L'utente loggato viene letto dalla sessione (session.js), popolata da /auth/login.
    - Progetto non ha campi per progress/date/manager: restano "—" finché il
      backend non li espone (calcoliamo avanzamento e conteggio task lato client).
    - Ricerca/filtro sono applicati lato client, non c'è un parametro di query lato backend.
    - Un utente non amministratore vede solo i progetti a cui è associato (Employee
      o TeamLeader); l'amministratore vede tutti i progetti senza filtro.
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
            name,
            role: d.area,
            isAdmin: !!d.isAdmin,
            initials: (d.nome || '?').trim().charAt(0).toUpperCase() + (d.cognome || '').trim().charAt(0).toUpperCase(),
            avatarColor: colorForName(name)
        };
    }

    /**
     * Adatta il progetto restituito dal backend (idProgetto, nome, descrizione,
     * stato, attivita) alla forma attesa dalla card. Avanzamento e conteggio task
     * sono calcolati dalle attività annidate; i campi non ancora forniti dal
     * backend (team, manager, date) restano null e vengono mostrati come "—".
     */
    function normalizeProject(raw, teamCountByProject, teamLeaderByProject) {
        const attivita = raw.attivita || [];
        const tasksTotal = attivita.length || null;
        const tasksCompleted = attivita.length ? attivita.filter(a => a.stato === 'completato').length : null;
        const progress = tasksTotal ? Math.round((tasksCompleted / tasksTotal) * 100) : null;

        return {
            id: raw.idProgetto,
            title: raw.nome,
            description: raw.descrizione,
            status: raw.stato,
            progress,
            tasksCompleted,
            tasksTotal,
            teamMembers: teamCountByProject.get(raw.idProgetto) ?? null,
            manager: teamLeaderByProject.get(raw.idProgetto) || null,
            startDate: raw.dataInizio || null,
            endDate: raw.dataFine || null
        };
    }

    async function apiGetDipendenti() {
        const res = await Session.authFetch(`${BASE_URL}/dipendenti/lista`);
        if (!res.ok) throw new Error(`Errore API: ${res.status}`);
        return res.json();
    }

    async function apiGetAssociati() {
        const res = await Session.authFetch(`${BASE_URL}/associati`);
        if (!res.ok) throw new Error(`Errore API: ${res.status}`);
        return res.json();
    }

    async function apiGetProjects(query = '') {
        const [projectsRes, associatiRes] = await Promise.all([
            Session.authFetch(`${BASE_URL}/progetti/lista`),
            Session.authFetch(`${BASE_URL}/associati`)
        ]);
        if (!projectsRes.ok) throw new Error(`Errore API: ${projectsRes.status}`);

        let rawProjects = await projectsRes.json();
        const teamCountByProject = new Map();
        const teamLeaderByProject = new Map();
        let associati = [];
        if (associatiRes.ok) {
            associati = await associatiRes.json();
            associati.forEach(a => {
                if (!a.progetto) return;
                const id = a.progetto.idProgetto;
                teamCountByProject.set(id, (teamCountByProject.get(id) || 0) + 1);
                if (a.dipendente && (a.ruolo || '').toLowerCase() === 'capoprogetto') {
                    teamLeaderByProject.set(id, `${a.dipendente.nome} ${a.dipendente.cognome}`.trim());
                }
            });
        }

        // Un utente non amministratore vede solo i progetti a cui è associato
        // (come Employee o TeamLeader); l'amministratore li vede tutti.
        if (!CURRENT_USER || !CURRENT_USER.isAdmin) {
            const myProjectIds = new Set(
                associati
                    .filter(a => a.dipendente && a.dipendente.idDipendente === CURRENT_DIPENDENTE_ID && a.progetto)
                    .map(a => a.progetto.idProgetto)
            );
            rawProjects = rawProjects.filter(p => myProjectIds.has(p.idProgetto));
        }

        const projects = rawProjects.map(p => normalizeProject(p, teamCountByProject, teamLeaderByProject));

        const q = query.trim().toLowerCase();
        if (!q) return projects;
        return projects.filter(p =>
            (p.title || '').toLowerCase().includes(q) ||
            (p.description || '').toLowerCase().includes(q)
        );
    }

    async function parseErrorMessage(res, fallback) {
        try {
            const body = await res.json();
            return body && body.messaggio ? body.messaggio : fallback;
        } catch {
            return fallback;
        }
    }

    // La colonna data_fine è NOT NULL per le associazioni progetto: usiamo una
    // data lontana come "nessuna scadenza" (coerente con progetti-dettaglio.js).
    const FAR_FUTURE_DATE = '2099-12-31';

    async function apiCreateProject(payload) {
        const res = await Session.authFetch(`${BASE_URL}/progetti/crea`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nome: payload.nome, descrizione: payload.descrizione, stato: payload.stato,
                dataInizio: payload.dataInizio || null, dataFine: payload.dataFine || null
            })
        });
        if (!res.ok) throw new Error(await parseErrorMessage(res, `Errore API: ${res.status}`));
        const project = await res.json();

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
                body: JSON.stringify({ idDipendente, idProgetto: project.idProgetto, ruolo, dataInizio: today, dataFine: FAR_FUTURE_DATE })
            });
        }
        return project;
    }

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
    function translateStatus(s) {
        const key = STATUS_KEY[(s || '').toLowerCase()];
        return key ? I18N.t(key) : capitalize(s);
    }

    const STATUS_CLASS = {
        'attivo':      'status--completato',
        'completato':  'status--completato',
        'in corso':    'status--in-corso',
        'in pausa':    'status--in-pausa',
        'pianificato': 'status--da-fare',
        'da fare':     'status--da-fare',
        'bloccato':    'status--bloccato'
    };

    /* ──────────────────────────────────────────────────────
       RENDER
    ────────────────────────────────────────────────────── */

    function renderProjectCard(project) {
        const dateRangeEl = project.startDate
            ? (project.endDate
                ? `${formatDateIT(project.startDate)} - ${formatDateIT(project.endDate)}`
                : formatDateIT(project.startDate))
            : '—';

        const progressValue = project.progress != null ? `${project.progress}%` : '—';
        const progressWidth = project.progress != null ? project.progress : 0;

        const tasksValue = (project.tasksCompleted != null && project.tasksTotal != null)
            ? `${project.tasksCompleted} / ${project.tasksTotal}`
            : '—';

        const teamValue = project.teamMembers != null ? I18N.t('progetti.membriCount', {count: project.teamMembers}) : '—';
        const managerValue = project.manager || '—';

        return `
        <article class="project-card" data-id="${project.id}">
            <div class="project-card__header">
                <h3 class="project-card__title">${project.title}</h3>
                <span class="badge-status ${STATUS_CLASS[(project.status || '').toLowerCase()] || ''}">${translateStatus(project.status)}</span>
            </div>
            <p class="project-card__desc">${project.description}</p>
            <div class="project-progress">
                <div class="progress__header">
                    <span class="progress__label">${I18N.t('progetti.avanzamento')}</span>
                    <span class="progress__value">${progressValue}</span>
                </div>
                <div class="progress__track"
                     role="progressbar"
                     aria-valuenow="${progressWidth}"
                     aria-valuemin="0"
                     aria-valuemax="100"
                     aria-label="${I18N.t('progetti.avanzamento')} ${progressValue}">
                    <div class="progress__fill" style="width:${progressWidth}%"></div>
                </div>
            </div>
            <div class="project-card__info">
                <div class="info-row">
                    <span class="info-row__label">${I18N.t('progetti.attivita')}</span>
                    <span class="info-row__value">${tasksValue}</span>
                </div>
                <div class="info-row">
                    <span class="info-row__label">${I18N.t('progetti.team')}</span>
                    <span class="info-row__value">${teamValue}</span>
                </div>
                <div class="info-row">
                    <span class="info-row__label">${I18N.t('progetti.manager')}</span>
                    <span class="info-row__value">${managerValue}</span>
                </div>
            </div>
            <div class="project-card__footer">${dateRangeEl}</div>
        </article>`;
    }

    function renderProjects(projects) {
        const grid = document.getElementById('project-grid');

        if (projects.length === 0) {
            grid.innerHTML = `<p class="state state--empty">${I18N.t('progetti.noneFound')}</p>`;
            return;
        }

        grid.innerHTML = projects.map(renderProjectCard).join('');

        grid.querySelectorAll('.project-card').forEach(card => {
            card.addEventListener('click', () => {
                location.href = `progetti-dettaglio.html?id=${card.dataset.id}`;
            });
        });
    }

    /* ──────────────────────────────────────────────────────
       MODALE — Crea nuovo progetto (solo Admin)
    ────────────────────────────────────────────────────── */

    let allDipendenti = [];

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

    function openCreateModal() {
        document.getElementById('create-form').reset();
        document.getElementById('create-form-error').hidden = true;
        document.getElementById('create-manager-search').value = '';
        document.getElementById('create-members-search').value = '';
        renderRadioList('create-manager', allDipendenti, () => false, d => d.idDipendente, d => `${d.nome} ${d.cognome}`, d => d.area);
        renderChecklist('create-members', allDipendenti, () => false, d => d.idDipendente, d => `${d.nome} ${d.cognome}`, d => d.area);
        document.getElementById('create-modal-overlay').hidden = false;
    }

    function closeCreateModal() {
        document.getElementById('create-modal-overlay').hidden = true;
    }

    async function onSubmitCreateForm(e) {
        e.preventDefault();
        const saveBtn = document.getElementById('create-save-btn');
        const errorEl = document.getElementById('create-form-error');
        errorEl.hidden = true;

        const payload = {
            nome: document.getElementById('create-nome').value.trim(),
            descrizione: document.getElementById('create-desc').value.trim(),
            stato: document.getElementById('create-stato').value,
            dataInizio: document.getElementById('create-data-inizio').value || null,
            dataFine: document.getElementById('create-data-fine').value || null,
            teamLeaderId: getRadioValue('create-manager'),
            memberIds: getCheckedValues('create-members')
        };

        saveBtn.disabled = true;
        try {
            const project = await apiCreateProject(payload);
            closeCreateModal();
            Toast.successBeforeNavigate(I18N.t('progetti.createdSuccess'));
            location.href = `progetti-dettaglio.html?id=${project.idProgetto}`;
        } catch (err) {
            const message = err.message || I18N.t('progetti.createError');
            errorEl.textContent = message;
            errorEl.hidden = false;
            Toast.error(message);
            console.error('[onSubmitCreateForm]', err);
        } finally {
            saveBtn.disabled = false;
        }
    }

    /* ──────────────────────────────────────────────────────
       DATA LOADING
    ────────────────────────────────────────────────────── */

    async function loadReferenceData() {
        try {
            allDipendenti = await apiGetDipendenti();
        } catch (err) {
            console.error('[loadReferenceData]', err);
        }
    }

    async function loadProjects(query = '') {
        const grid = document.getElementById('project-grid');
        if (!query) {
            grid.innerHTML = `<p class="state state--loading">${I18N.t('common.loading')}</p>`;
        }
        try {
            const projects = await apiGetProjects(query);
            renderProjects(projects);
        } catch (err) {
            grid.innerHTML = `<p class="state state--error">${I18N.t('common.errorLoadingRetry')}</p>`;
            console.error('[loadProjects]', err);
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
            const newProjectBtn = document.getElementById('new-project-btn');
            if (newProjectBtn) newProjectBtn.hidden = !user.isAdmin;
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
            loadProjects(e.target.value.trim());
        }, 280);
    }

    /* ──────────────────────────────────────────────────────
       INIT
    ────────────────────────────────────────────────────── */

    document.addEventListener('DOMContentLoaded', async () => {
        const params = new URLSearchParams(location.search);
        const projectParam = params.get('project') || '';

        const searchInput = document.getElementById('search-input');
        if (projectParam) searchInput.value = projectParam;

        await Promise.all([loadUser(), loadReferenceData(), loadProjects(projectParam)]);
        searchInput.addEventListener('input', onSearch);
        document.getElementById('logout-btn').addEventListener('click', Session.logout);

        setupChecklistSearch('create-manager-search', 'create-manager');
        setupChecklistSearch('create-members-search', 'create-members');

        document.getElementById('new-project-btn').addEventListener('click', openCreateModal);
        document.getElementById('create-modal-close-btn').addEventListener('click', closeCreateModal);
        document.getElementById('create-cancel-btn').addEventListener('click', closeCreateModal);
        document.getElementById('create-form').addEventListener('submit', onSubmitCreateForm);
        document.getElementById('create-modal-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'create-modal-overlay') closeCreateModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !document.getElementById('create-modal-overlay').hidden) closeCreateModal();
        });
    });

    document.addEventListener('i18n:change', () => {
        loadUser();
        loadProjects(document.getElementById('search-input').value.trim());
    });

})();
