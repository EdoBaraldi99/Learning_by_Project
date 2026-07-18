(() => {
    'use strict';

    /* ________________________________________________________________________________________________________________________

    STRATO DI ACCESSO API — chiama il backend reale (Spring Boot).
    _________________________________________________________________________________________________________________________
    Endpoint usati:
        GET   /dipendenti/{id}
        GET   /progetti/lista
        GET   /attivita/lista
        GET   /storici/lista
        POST  /storici/crea

    NOTE SUI LIMITI ATTUALI DEL BACKEND:
    - Non ci sono endpoint di reportistica dedicati: le statistiche/i grafici sono
      calcolati lato client da /attivita/lista, /progetti/lista e /storici/lista.
    - I grafici sono disegnati con SVG generato lato client (nessuna libreria esterna).
    - Ambito visibilità: Admin vede le statistiche di TUTTO il sistema; un dipendente
      con ruolo diverso da "Dipendente" su almeno un progetto (TeamLeader) vede le
      statistiche solo dei progetti che gestisce; un Dipendente "puro" vede invece
      il proprio report giornaliero di lavoro (comportamento invariato).
    - Storico non ha un riferimento al dipendente che ha registrato la voce: nella
      vista personale (Dipendente) le voci mostrate sono quelle relative alle
      attività assegnate all'utente corrente (non un filtro esatto per "chi" ha
      lavorato).
    - Tempo stimato/lavorato sono stringhe: i dati storici usano il formato "N ore",
      le voci create/modificate da questa app usano "Xh Ym" — parseMinutes riconosce
      entrambi.
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

    let cachedUser = null;
    async function apiGetCurrentUser() {
        const res = await Session.authFetch(`${BASE_URL}/dipendenti/${CURRENT_DIPENDENTE_ID}`);
        if (!res.ok) throw new Error(`Errore API: ${res.status}`);
        const d = await res.json();
        const name = `${d.nome} ${d.cognome}`.trim();
        cachedUser = {
            name,
            role: d.area,
            isAdmin: !!d.isAdmin,
            initials: (d.nome || '?').trim().charAt(0).toUpperCase() + (d.cognome || '').trim().charAt(0).toUpperCase(),
            avatarColor: colorForName(name)
        };
        return cachedUser;
    }

    async function apiGetProjects() {
        const res = await Session.authFetch(`${BASE_URL}/progetti/lista`);
        if (!res.ok) throw new Error(`Errore API: ${res.status}`);
        return res.json();
    }

    async function apiGetTasks() {
        const res = await Session.authFetch(`${BASE_URL}/attivita/lista`);
        if (!res.ok) throw new Error(`Errore API: ${res.status}`);
        return res.json();
    }

    async function apiGetStorici() {
        const res = await Session.authFetch(`${BASE_URL}/storici/lista`);
        if (!res.ok) throw new Error(`Errore API: ${res.status}`);
        return res.json();
    }

    // Ruolo effettivo sulla pagina: 'admin' (statistiche di tutto il sistema),
    // 'manager' (statistiche limitate ai progetti gestiti), 'employee' (vista
    // personale invariata) — stessa regola di derivazione usata in attivita-generale.js.
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

    /* ──────────────────────────────────────────────────────
       VISTA DIPENDENTE — Report giornaliero personale (invariata)
    ────────────────────────────────────────────────────── */

    function normalizeTaskForSelect(raw) {
        return {
            id: raw.idTask,
            title: raw.titolo,
            project: raw.progetto ? raw.progetto.nome : '—',
            category: raw.tipologia,
            status: raw.stato,
            estimatedMinutes: parseMinutes(raw.tempoStimato)
        };
    }

    async function apiGetMyTasks() {
        const raw = await apiGetTasks();
        return raw
            .filter(t => (t.assegnati || []).some(a => a.dipendente && a.dipendente.idDipendente === CURRENT_DIPENDENTE_ID))
            .map(normalizeTaskForSelect);
    }

    async function apiGetReportEntries(myTasks) {
        const raw = await apiGetStorici();
        const myTaskIds = new Set(myTasks.map(t => t.id));
        const userName = cachedUser ? cachedUser.name : '';

        return raw
            .filter(s => s.attivita && myTaskIds.has(s.attivita.idTask))
            .map(s => {
                const minutes = parseMinutes(s.tempoLavorato);
                return {
                    id: s.idStorico,
                    taskId: s.attivita.idTask,
                    taskTitle: s.attivita.titolo,
                    project: s.attivita.progetto ? s.attivita.progetto.nome : '—',
                    assignee: userName,
                    description: s.descrizione,
                    date: s.data,
                    hours: Math.floor(minutes / 60),
                    minutes: minutes % 60,
                    category: s.attivita.tipologia
                };
            })
            .sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.id - a.id);
    }

    function computePersonalStats(myTasks, entries) {
        const totalTasks = myTasks.length;
        const completedTasks = myTasks.filter(t => t.status === 'completato').length;
        const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const estimatedMinutes = myTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
        const actualMinutes = entries.reduce((sum, e) => sum + e.hours * 60 + e.minutes, 0);

        return {
            totalTasks,
            completionRate,
            estimatedHours: Math.round(estimatedMinutes / 60),
            actualHours: Math.round(actualMinutes / 60)
        };
    }

    async function apiCreateReportEntry(payload) {
        const res = await Session.authFetch(`${BASE_URL}/storici/crea`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                data: payload.date,
                descrizione: payload.description,
                tempoLavorato: `${Number(payload.hours) || 0}h ${Number(payload.minutes) || 0}m`,
                idTask: Number(payload.taskId)
            })
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

    function formatDuration(hours, minutes) {
        return `${hours}h ${minutes}m`;
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

    /* ──────────────────────────────────────────────────────
       SVG ICONS
    ────────────────────────────────────────────────────── */

    const ICON = {
        checkSquare: `<svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <rect x="3" y="3" width="14" height="14" rx="3" stroke="currentColor" stroke-width="1.6"/>
            <path d="M6.5 10.2l2.2 2.2 4.8-5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,
        trendUp: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0 015.814-5.518L21.75 6"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M16.5 6h5.25v5.25"/>
        </svg>`,
        clockOutline: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden="true">
            <circle cx="10" cy="10" r="7.25" stroke-width="1.6"/>
            <path d="M10 6v4l2.5 2" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,
        clockFilled: `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
        </svg>`,
        calendar: `<svg class="meta-icon meta-icon--calendar" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
        </svg>`,
        clock: `<svg class="meta-icon meta-icon--clock" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
        </svg>`
    };

    /* ──────────────────────────────────────────────────────
       RENDER — Vista personale
    ────────────────────────────────────────────────────── */

    function renderPersonalStatCards(stats) {
        const el = document.getElementById('stat-cards');
        el.innerHTML = `
        <div class="stat-card">
            <div class="stat-card__header">
                <span class="stat-card__label">${I18N.t('report.totalTasks')}</span>
                ${ICON.checkSquare.replace('<svg ', '<svg class="stat-card__icon stat-card__icon--muted" ')}
            </div>
            <span class="stat-card__value">${stats.totalTasks}</span>
        </div>
        <div class="stat-card">
            <div class="stat-card__header">
                <span class="stat-card__label">${I18N.t('report.completionRate')}</span>
                ${ICON.trendUp.replace('<svg ', '<svg class="stat-card__icon stat-card__icon--green" ')}
            </div>
            <span class="stat-card__value">${stats.completionRate}%</span>
        </div>
        <div class="stat-card">
            <div class="stat-card__header">
                <span class="stat-card__label">${I18N.t('report.estimatedTime')}</span>
                ${ICON.clockOutline.replace('<svg ', '<svg class="stat-card__icon stat-card__icon--muted" ')}
            </div>
            <span class="stat-card__value">${stats.estimatedHours}h</span>
        </div>
        <div class="stat-card">
            <div class="stat-card__header">
                <span class="stat-card__label">${I18N.t('report.actualTime')}</span>
                ${ICON.clockFilled.replace('<svg ', '<svg class="stat-card__icon stat-card__icon--blue" ')}
            </div>
            <span class="stat-card__value">${stats.actualHours}h</span>
        </div>`;
    }

    function renderEntryCard(entry) {
        return `
        <article class="report-card" data-id="${entry.id}">
            <h3 class="report-card__title">${entry.taskTitle}</h3>
            <p class="report-card__meta-line">
                ${entry.project} <span class="meta-sep">•</span> ${entry.assignee}
            </p>
            <p class="report-card__desc">${entry.description}</p>
            <div class="report-meta">
                <span class="report-meta__item report-meta__item--date">
                    ${ICON.calendar}
                    <span>${formatDateIT(entry.date)}</span>
                </span>
                <span class="report-meta__item report-meta__item--time">
                    ${ICON.clock}
                    <span>${formatDuration(entry.hours, entry.minutes)}</span>
                </span>
                <span class="report-meta__tag">${translateCategory(entry.category)}</span>
            </div>
        </article>`;
    }

    function renderEntries(entries) {
        const list = document.getElementById('report-list');

        if (entries.length === 0) {
            list.innerHTML = `<p class="state state--empty">${I18N.t('report.noEntriesRegistered')}</p>`;
            return;
        }

        list.innerHTML = entries.map(renderEntryCard).join('');
    }

    function renderTaskOptions(tasks) {
        const select = document.getElementById('task-select');
        const options = tasks.map(t =>
            `<option value="${t.id}">${t.title} — ${t.project}</option>`
        ).join('');
        select.innerHTML = `<option value="" disabled selected>${I18N.t('report.taskSelectDefault')}</option>${options}`;
    }

    let myTasks = [];

    async function loadPersonalReport() {
        const statsEl = document.getElementById('stat-cards');
        const listEl = document.getElementById('report-list');
        try {
            myTasks = await apiGetMyTasks();
            renderTaskOptions(myTasks);

            const entries = await apiGetReportEntries(myTasks);
            renderEntries(entries);
            renderPersonalStatCards(computePersonalStats(myTasks, entries));
        } catch (err) {
            statsEl.innerHTML = `<p class="state state--error">${I18N.t('common.errorLoadingStats')}</p>`;
            listEl.innerHTML = `<p class="state state--error">${I18N.t('common.errorLoadingRetry')}</p>`;
            console.error('[loadPersonalReport]', err);
        }
    }

    /* ──────────────────────────────────────────────────────
       VISTA ADMIN/TEAMLEADER — Analytics con grafici SVG
    ────────────────────────────────────────────────────── */

    // Accorcia un'etichetta troppo lunga per lo spazio disponibile nel grafico,
    // evitando che vada a sovrapporsi a quella adiacente; il nome completo resta
    // comunque disponibile al passaggio del mouse tramite <title>.
    function truncateLabel(text, maxLen) {
        const s = text || '';
        return s.length > maxLen ? `${s.slice(0, maxLen - 1)}…` : s;
    }

    function renderPieChart(container, segments) {
        const total = segments.reduce((s, x) => s + x.value, 0);
        if (!total) {
            container.innerHTML = `<p class="state state--empty-chart">${I18N.t('report.noDataAvailable')}</p>`;
            return;
        }

        const size = 170, r = 68, cx = size / 2, cy = size / 2;
        const circumference = 2 * Math.PI * r;
        let offset = 0;

        const circles = segments.filter(s => s.value > 0).map(s => {
            const len = (s.value / total) * circumference;
            const circle = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${s.color}" stroke-width="28"
                stroke-dasharray="${len} ${circumference - len}" stroke-dashoffset="${-offset}"></circle>`;
            offset += len;
            return circle;
        }).join('');

        const legend = segments.map(s => `
            <div class="pie-legend__item">
                <span class="pie-legend__dot" style="background:${s.color}"></span>
                <span>${s.label}: <span class="pie-legend__value">${s.value}</span></span>
            </div>`).join('');

        container.innerHTML = `
            <svg viewBox="0 0 ${size} ${size}" width="190" height="190">
                <g transform="rotate(-90 ${cx} ${cy})">${circles}</g>
            </svg>
            <div class="pie-legend">${legend}</div>`;
    }

    function renderBarChart(container, bars) {
        const max = Math.max(1, ...bars.map(b => b.value));
        const width = 460, height = 190, barGap = 24, chartTop = 10, chartBottom = 160;
        const barWidth = (width - barGap * (bars.length + 1)) / bars.length;

        const barsSvg = bars.map((b, i) => {
            const h = (b.value / max) * (chartBottom - chartTop);
            const x = barGap + i * (barWidth + barGap);
            const y = chartBottom - h;
            return `
                <text x="${x + barWidth / 2}" y="${y - 8}" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text-primary)">${b.value}</text>
                <rect x="${x}" y="${y}" width="${barWidth}" height="${h}" rx="4" fill="${b.color}"></rect>
                <text x="${x + barWidth / 2}" y="${chartBottom + 18}" text-anchor="middle" font-size="12" fill="var(--text-secondary)">${b.label}</text>
            `;
        }).join('');

        container.innerHTML = `<svg viewBox="0 0 ${width} ${height + 20}" width="100%" height="210">${barsSvg}</svg>`;
    }

    function renderStackedBarChart(container, projects) {
        if (!projects.length) {
            container.innerHTML = `<p class="state state--empty-chart">${I18N.t('report.noProjectAvailable')}</p>`;
            return;
        }

        const max = Math.max(1, ...projects.map(p => p.total));
        const height = 190, chartTop = 10, chartBottom = 160;
        const groupWidth = 100, barWidth = 30, barGap = 8;
        const width = Math.max(460, projects.length * groupWidth + 40);

        const barsSvg = projects.map((p, i) => {
            const groupX = 20 + i * groupWidth;
            const completedH = (p.completed / max) * (chartBottom - chartTop);
            const inProgressH = (p.inProgress / max) * (chartBottom - chartTop);
            const totalH = (p.total / max) * (chartBottom - chartTop);

            const stackX = groupX;
            const totalX = groupX + barWidth + barGap;

            return `
                <rect x="${stackX}" y="${chartBottom - completedH - inProgressH}" width="${barWidth}" height="${inProgressH}" fill="#d97706"></rect>
                <rect x="${stackX}" y="${chartBottom - completedH}" width="${barWidth}" height="${completedH}" fill="#16a34a"></rect>
                <rect x="${totalX}" y="${chartBottom - totalH}" width="${barWidth}" height="${totalH}" fill="#cbd5e1"></rect>
                <text x="${groupX + barWidth}" y="${chartBottom + 18}" text-anchor="middle" font-size="11.5" fill="var(--text-secondary)">${truncateLabel(p.name, 12)}<title>${p.name}</title></text>
            `;
        }).join('');

        container.innerHTML = `
            <svg viewBox="0 0 ${width} ${height + 20}" width="100%" height="210">${barsSvg}</svg>
            <div class="bar-legend">
                <span class="bar-legend__item"><span class="bar-legend__swatch" style="background:#16a34a"></span>${I18N.t('report.completate')}</span>
                <span class="bar-legend__item"><span class="bar-legend__swatch" style="background:#d97706"></span>${I18N.t('report.inCorso')}</span>
                <span class="bar-legend__item"><span class="bar-legend__swatch" style="background:#cbd5e1"></span>${I18N.t('report.totale')}</span>
            </div>`;
    }

    let lastTasksForExport = [];

    function exportCsv() {
        const header = [
            I18N.t('field.titolo'), I18N.t('field.progetto'), I18N.t('field.stato'), I18N.t('field.priorita'),
            I18N.t('field.tipologia'), I18N.t('field.scadenza'), I18N.t('report.estimatedTime')
        ];
        const rows = lastTasksForExport.map(t => [
            t.titolo, t.progetto ? t.progetto.nome : '', translateStatus(t.stato), translatePriority(t.priorita), translateCategory(t.tipologia), t.scadenza || '', t.tempoStimato
        ]);
        const csv = [header, ...rows]
            .map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
            .join('\r\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-attivita-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    // Per l'Admin le statistiche coprono sempre tutto il sistema. Per il TeamLeader
    // sono invece filtrate a un singolo progetto scelto tramite il selettore
    // (#analytics-project-select), non aggregate su tutti i progetti gestiti.
    async function loadAnalyticsReport(scope, selectedProjectId) {
        const statsEl = document.getElementById('stat-cards');
        try {
            const [allTasks, allProjects, allStorici] = await Promise.all([apiGetTasks(), apiGetProjects(), apiGetStorici()]);

            const projects = scope.role === 'admin'
                ? allProjects
                : allProjects.filter(p => p.idProgetto === selectedProjectId);
            const projectIds = new Set(projects.map(p => p.idProgetto));
            const tasks = scope.role === 'admin' ? allTasks : allTasks.filter(t => t.progetto && projectIds.has(t.progetto.idProgetto));
            const taskIds = new Set(tasks.map(t => t.idTask));
            const storici = allStorici.filter(s => s.attivita && taskIds.has(s.attivita.idTask));

            lastTasksForExport = tasks;

            const totalTasks = tasks.length;
            const completedTasks = tasks.filter(t => t.stato === 'completato').length;
            const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

            const estimatedMinutes = tasks.reduce((sum, t) => sum + parseMinutes(t.tempoStimato), 0);
            const actualMinutesByTask = new Map();
            storici.forEach(s => {
                actualMinutesByTask.set(s.attivita.idTask, (actualMinutesByTask.get(s.attivita.idTask) || 0) + parseMinutes(s.tempoLavorato));
            });
            const actualMinutes = Array.from(actualMinutesByTask.values()).reduce((a, b) => a + b, 0);

            statsEl.innerHTML = `
            <div class="stat-card">
                <div class="stat-card__header"><span class="stat-card__label">${I18N.t('report.totalTasks')}</span></div>
                <span class="stat-card__value">${totalTasks}</span>
            </div>
            <div class="stat-card">
                <div class="stat-card__header"><span class="stat-card__label">${I18N.t('report.completionRate')}</span></div>
                <span class="stat-card__value">${completionRate}%</span>
            </div>
            <div class="stat-card">
                <div class="stat-card__header"><span class="stat-card__label">${I18N.t('report.estimatedTime')}</span></div>
                <span class="stat-card__value">${Math.round(estimatedMinutes / 60)}h</span>
            </div>
            <div class="stat-card">
                <div class="stat-card__header"><span class="stat-card__label">${I18N.t('report.actualTime')}</span></div>
                <span class="stat-card__value">${Math.round(actualMinutes / 60)}h</span>
            </div>`;

            const statusCounts = { completato: 0, 'in corso': 0, bloccato: 0, 'da iniziare': 0, 'in pausa': 0 };
            tasks.forEach(t => { const s = (t.stato || '').toLowerCase(); if (s in statusCounts) statusCounts[s]++; });

            renderPieChart(document.getElementById('chart-status'), [
                { label: I18N.t('status.daIniziare'), value: statusCounts['da iniziare'], color: '#64748b' },
                { label: I18N.t('report.inCorso'), value: statusCounts['in corso'], color: '#d97706' },
                { label: I18N.t('report.completate'), value: statusCounts.completato, color: '#16a34a' },
                { label: I18N.t('report.bloccate'), value: statusCounts.bloccato, color: '#dc2626' },
                { label: I18N.t('report.inPausa'), value: statusCounts['in pausa'], color: '#9333ea' }
            ]);

            const priorityCounts = { bassa: 0, media: 0, alta: 0, urgente: 0 };
            tasks.forEach(t => { const p = (t.priorita || '').toLowerCase(); if (p in priorityCounts) priorityCounts[p]++; });

            renderBarChart(document.getElementById('chart-priority'), [
                { label: I18N.t('priority.bassa'), value: priorityCounts.bassa, color: '#22c55e' },
                { label: I18N.t('priority.media'), value: priorityCounts.media, color: '#3b82f6' },
                { label: I18N.t('priority.alta'), value: priorityCounts.alta, color: '#f97316' },
                { label: I18N.t('priority.urgente'), value: priorityCounts.urgente, color: '#ef4444' }
            ]);

            const projectStats = projects.map(p => {
                const projectTasks = tasks.filter(t => t.progetto && t.progetto.idProgetto === p.idProgetto);
                return {
                    name: p.nome,
                    completed: projectTasks.filter(t => t.stato === 'completato').length,
                    inProgress: projectTasks.filter(t => t.stato === 'in corso').length,
                    total: projectTasks.length
                };
            });
            renderStackedBarChart(document.getElementById('chart-projects'), projectStats);
        } catch (err) {
            statsEl.innerHTML = `<p class="state state--error">${I18N.t('common.errorLoadingStats')}</p>`;
            console.error('[loadAnalyticsReport]', err);
        }
    }

    /* ──────────────────────────────────────────────────────
       USER + ROLE SWITCH
    ────────────────────────────────────────────────────── */

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

    function applyRoleLayout(scope) {
        const isAnalytics = scope.role !== 'employee';
        const title = isAnalytics ? I18N.t('report.titleAnalytics') : I18N.t('report.titlePersonal');
        document.title = `${title} – Gestione e monitoraggio`;
        document.getElementById('page-header-title').textContent = title;
        document.getElementById('page-header-subtitle').textContent = isAnalytics ? I18N.t('report.subtitleAnalytics') : I18N.t('report.subtitlePersonal');
        document.getElementById('new-entry-btn').hidden = isAnalytics;
        document.getElementById('export-btn').hidden = !isAnalytics;
        document.getElementById('report-list').hidden = isAnalytics;
        document.getElementById('charts-row').hidden = !isAnalytics;
        document.getElementById('analytics-project-filter').hidden = scope.role !== 'manager';
    }

    // Popola il selettore progetto del TeamLeader e ricarica le statistiche
    // (filtrate a un solo progetto per volta) a ogni cambio di selezione.
    function setupProjectFilter(projects, scope) {
        const select = document.getElementById('analytics-project-select');
        const managed = projects.filter(p => scope.managedProjectIds.includes(p.idProgetto));
        select.innerHTML = managed.map(p => `<option value="${p.idProgetto}">${p.nome}</option>`).join('');
        select.addEventListener('change', () => {
            currentAnalyticsProjectId = Number(select.value);
            loadAnalyticsReport(scope, currentAnalyticsProjectId);
        });
        return managed.length ? managed[0].idProgetto : null;
    }

    /* ──────────────────────────────────────────────────────
       MODALE — Nuova voce (solo vista Dipendente)
    ────────────────────────────────────────────────────── */

    function openModal() {
        const overlay = document.getElementById('modal-overlay');
        const form = document.getElementById('entry-form');
        form.reset();
        document.getElementById('entry-hours').value = 0;
        document.getElementById('entry-minutes').value = 0;
        updateSaveButtonState();
        overlay.hidden = false;
    }

    function closeModal() {
        document.getElementById('modal-overlay').hidden = true;
    }

    function updateSaveButtonState() {
        const taskSelect = document.getElementById('task-select');
        const dateInput = document.getElementById('entry-date');
        const saveBtn = document.getElementById('save-btn');
        saveBtn.disabled = !taskSelect.value || !dateInput.value;
    }

    async function onSubmitEntry(e) {
        e.preventDefault();
        const saveBtn = document.getElementById('save-btn');
        const payload = {
            taskId: document.getElementById('task-select').value,
            date: document.getElementById('entry-date').value,
            description: document.getElementById('entry-desc').value.trim(),
            hours: document.getElementById('entry-hours').value,
            minutes: document.getElementById('entry-minutes').value
        };

        saveBtn.disabled = true;
        const originalLabel = saveBtn.innerHTML;
        saveBtn.textContent = I18N.t('common.saving');

        try {
            await apiCreateReportEntry(payload);
            closeModal();
            await loadPersonalReport();
            Toast.success(I18N.t('report.savedSuccess'));
        } catch (err) {
            console.error('[onSubmitEntry]', err);
            Toast.error(err.message || I18N.t('report.saveError'));
            saveBtn.innerHTML = originalLabel;
            updateSaveButtonState();
        }
    }

    /* ──────────────────────────────────────────────────────
       INIT
    ────────────────────────────────────────────────────── */

    let currentScope = null;
    let currentAnalyticsProjectId = null;

    document.addEventListener('DOMContentLoaded', async () => {
        await loadUser();

        const projects = await apiGetProjects().catch(() => []);
        const scope = deriveScope(projects);
        currentScope = scope;
        applyRoleLayout(scope);

        if (scope.role === 'employee') {
            await loadPersonalReport();
        } else if (scope.role === 'manager') {
            currentAnalyticsProjectId = setupProjectFilter(projects, scope);
            await loadAnalyticsReport(scope, currentAnalyticsProjectId);
            document.getElementById('export-btn').addEventListener('click', exportCsv);
        } else {
            await loadAnalyticsReport(scope);
            document.getElementById('export-btn').addEventListener('click', exportCsv);
        }

        document.getElementById('new-entry-btn').addEventListener('click', openModal);
        document.getElementById('modal-close-btn').addEventListener('click', closeModal);
        document.getElementById('cancel-btn').addEventListener('click', closeModal);

        document.getElementById('modal-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'modal-overlay') closeModal();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !document.getElementById('modal-overlay').hidden) closeModal();
        });

        document.getElementById('task-select').addEventListener('change', updateSaveButtonState);
        document.getElementById('entry-date').addEventListener('input', updateSaveButtonState);
        document.getElementById('entry-form').addEventListener('submit', onSubmitEntry);
        document.getElementById('logout-btn').addEventListener('click', Session.logout);
    });

    document.addEventListener('i18n:change', () => {
        loadUser();
        if (!currentScope) return;
        applyRoleLayout(currentScope);
        if (currentScope.role === 'employee') {
            loadPersonalReport();
        } else {
            loadAnalyticsReport(currentScope, currentAnalyticsProjectId);
        }
    });

})();
