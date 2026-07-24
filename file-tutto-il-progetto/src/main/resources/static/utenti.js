(() => {
    'use strict';

    /* ________________________________________________________________________________________________________________________

    STRATO DI ACCESSO API — chiama il backend reale (Spring Boot).
    _________________________________________________________________________________________________________________________
    Endpoint usati:
        GET     /dipendenti/{id}
        GET     /dipendenti/lista
        POST    /dipendenti/crea
        PATCH   /dipendenti/modifica/{id}
        DELETE  /dipendenti/elimina/{id}
        GET     /attivita/lista   (per contare le attività attive/completate di ogni utente)
        GET     /associati        (per dedurre il ruolo TeamLeader/Dipendente su un progetto)

    NOTE:
    - Pagina riservata agli amministratori (Dipendente.isAdmin): reindirizza a
      dashboard.html se l'utente in sessione non è admin.
    - Non esiste un ruolo "TeamLeader" persistito sul Dipendente: viene dedotto
      da Associato.ruolo (per-progetto) — se un dipendente ha ruolo diverso da
      "Employee" su almeno un progetto, viene mostrato come "TeamLeader".
    - modificaDipendentePerId non applica mai il campo password: il form di
      modifica non lo richiede; solo la creazione lo richiede (obbligatorio a
      livello di colonna DB).
    - Eliminare un dipendente con assegnazioni/associazioni collegate risponde
      con 409: il messaggio del backend viene mostrato così com'è, senza
      cancellare nulla automaticamente.
    ────────────────────────────────────────────────────── */

    const BASE_URL = '';
    const CURRENT_USER = Session.requireLogin();
    const CURRENT_DIPENDENTE_ID = CURRENT_USER ? CURRENT_USER.idDipendente : null;
    const IS_ADMIN = !!(CURRENT_USER && CURRENT_USER.isAdmin);

    const AVATAR_COLORS = ['blue', 'green', 'orange', 'red', 'purple'];
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

    async function apiGetCurrentUser() {
        const res = await Session.authFetch(`${BASE_URL}/dipendenti/${CURRENT_DIPENDENTE_ID}`);
        if (!res.ok) throw new Error(`Errore API: ${res.status}`);
        const d = await res.json();
        const name = `${d.nome} ${d.cognome}`.trim();
        return {
            name,
            role: d.isAdmin ? I18N.t('role.amministratore') : d.area,
            isAdmin: !!d.isAdmin,
            initials: (d.nome || '?').trim().charAt(0).toUpperCase() + (d.cognome || '').trim().charAt(0).toUpperCase(),
            avatarColor: colorForName(name)
        };
    }

    async function apiGetDipendenti() {
        const res = await Session.authFetch(`${BASE_URL}/dipendenti/lista`);
        if (!res.ok) throw new Error(`Errore API: ${res.status}`);
        return res.json();
    }

    async function apiGetTasks() {
        const res = await Session.authFetch(`${BASE_URL}/attivita/lista`);
        if (!res.ok) throw new Error(`Errore API: ${res.status}`);
        return res.json();
    }

    async function apiGetAssociati() {
        const res = await Session.authFetch(`${BASE_URL}/associati`);
        if (!res.ok) throw new Error(`Errore API: ${res.status}`);
        return res.json();
    }

    function normalizeUser(d, taskCountsByUser, teamLeaderIds) {
        const name = `${d.nome} ${d.cognome}`.trim();
        const counts = taskCountsByUser.get(d.idDipendente) || { active: 0, completed: 0 };
        let role = 'Dipendente';
        if (d.isAdmin) role = 'Amministratore';
        else if (teamLeaderIds.has(d.idDipendente)) role = 'Capoprogetto';
        return {
            id: d.idDipendente,
            name,
            email: d.email,
            area: d.area,
            isAdmin: !!d.isAdmin,
            role,
            initials: (d.nome || '?').trim().charAt(0).toUpperCase() + (d.cognome || '').trim().charAt(0).toUpperCase(),
            avatarColor: colorForName(name),
            activeTasks: counts.active,
            completedTasks: counts.completed
        };
    }

    async function apiGetUsers(query = '') {
        const [dipendenti, tasks, associati] = await Promise.all([
            apiGetDipendenti(), apiGetTasks(), apiGetAssociati()
        ]);

        const taskCountsByUser = new Map();
        tasks.forEach(t => {
            (t.assegnati || []).forEach(a => {
                if (!a.dipendente) return;
                const id = a.dipendente.idDipendente;
                const c = taskCountsByUser.get(id) || { active: 0, completed: 0 };
                if (t.stato === 'completato') c.completed++;
                else if (t.stato === 'in corso') c.active++;
                taskCountsByUser.set(id, c);
            });
        });

        const teamLeaderIds = new Set(
            associati
                .filter(a => a.dipendente && (a.ruolo || '').toLowerCase() !== 'dipendente')
                .map(a => a.dipendente.idDipendente)
        );

        // L'Admin non deve poter eliminare (né modificare) se stesso da qui: il
        // proprio profilo viene escluso a monte dall'elenco, non solo dai pulsanti.
        const visibleDipendenti = IS_ADMIN
            ? dipendenti.filter(d => d.idDipendente !== CURRENT_DIPENDENTE_ID)
            : dipendenti;
        const users = visibleDipendenti.map(d => normalizeUser(d, taskCountsByUser, teamLeaderIds));

        const q = query.trim().toLowerCase();
        if (!q) return users;
        return users.filter(u =>
            u.name.toLowerCase().includes(q) ||
            (u.email || '').toLowerCase().includes(q) ||
            (u.area || '').toLowerCase().includes(q)
        );
    }

    function splitFullName(fullName) {
        const parts = fullName.trim().split(/\s+/);
        const nome = parts.shift() || '';
        const cognome = parts.join(' ');
        return { nome, cognome };
    }

    // Il ruolo Admin non è un campo di DipendenteRequestDTO (creazione/modifica):
    // per sicurezza il backend lo gestisce solo tramite l'endpoint dedicato
    // PATCH /dipendenti/{id}/ruolo-admin, riservato agli Admin.
    async function apiSetAdmin(id, isAdmin) {
        const res = await Session.authFetch(`${BASE_URL}/dipendenti/${id}/ruolo-admin`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isAdmin })
        });
        if (!res.ok) throw new Error(await parseErrorMessage(res, `Errore API: ${res.status}`));
        return res.json();
    }

    async function apiCreateUser(payload) {
        const { nome, cognome } = splitFullName(payload.fullName);
        const res = await Session.authFetch(`${BASE_URL}/dipendenti/crea`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, cognome, email: payload.email, area: payload.area, password: payload.password })
        });
        if (!res.ok) throw new Error(await parseErrorMessage(res, `Errore API: ${res.status}`));
        const created = await res.json();
        if (payload.isAdmin) await apiSetAdmin(created.idDipendente, true);
        return created;
    }

    async function apiUpdateUser(id, payload) {
        const { nome, cognome } = splitFullName(payload.fullName);
        const res = await Session.authFetch(`${BASE_URL}/dipendenti/modifica/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, cognome, email: payload.email, area: payload.area })
        });
        if (!res.ok) throw new Error(await parseErrorMessage(res, `Errore API: ${res.status}`));
        await apiSetAdmin(id, payload.isAdmin);
        return res.json();
    }

    async function apiDeleteUser(id) {
        const res = await Session.authFetch(`${BASE_URL}/dipendenti/elimina/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(await parseErrorMessage(res, `Errore API: ${res.status}`));
    }

    /* ──────────────────────────────────────────────────────
       SVG ICONS
    ────────────────────────────────────────────────────── */

    const ICON = {
        mail: `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
        </svg>`,
        edit: `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"/>
            <path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd"/>
        </svg>`,
        trash: `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>`
    };

    const ROLE_CLASS = {
        'Amministratore': 'role--amministratore',
        'Capoprogetto':    'role--capoprogetto',
        'Dipendente':      'role--dipendente'
    };

    const ROLE_KEY = {
        'Amministratore': 'role.amministratore',
        'Capoprogetto': 'role.capoprogetto',
        'Dipendente': 'role.dipendente'
    };
    function translateRole(r) {
        const key = ROLE_KEY[r];
        return key ? I18N.t(key) : r;
    }

    /* ──────────────────────────────────────────────────────
       STATO LOCALE
    ────────────────────────────────────────────────────── */

    let allUsers = [];
    let editingUserId = null;
    let resetPasswordToggle = () => {};

    /* ──────────────────────────────────────────────────────
       RENDER
    ────────────────────────────────────────────────────── */

    function renderUserCard(user) {
        return `
        <article class="user-card-tile" data-id="${user.id}">
            <div class="user-card-tile__header">
                <div class="avatar user-card-tile__avatar avatar--${user.avatarColor}">${user.initials}</div>
                <div class="user-card-tile__info">
                    <div class="user-card-tile__top-row">
                        <span class="user-card-tile__name">${user.name}</span>
                        <span class="badge-role ${ROLE_CLASS[user.role] || ''}">${translateRole(user.role)}</span>
                    </div>
                    <div class="user-card-tile__email">${ICON.mail} ${user.email}</div>
                </div>
            </div>
            <div class="user-card-tile__info-rows">
                <div class="info-row">
                    <span class="info-row__label">${I18N.t('field.area')}</span>
                    <span class="info-row__value">${user.area}</span>
                </div>
            </div>
            <div class="user-card-tile__counts">
                <div class="info-row">
                    <span class="info-row__label">${I18N.t('utenti.attivitaAttive')}</span>
                    <span class="info-row__value">${user.activeTasks}</span>
                </div>
                <div class="info-row">
                    <span class="info-row__label">${I18N.t('utenti.completate')}</span>
                    <span class="info-row__value">${user.completedTasks}</span>
                </div>
            </div>
            ${IS_ADMIN ? `<div class="user-card-tile__actions">
                <button class="btn-edit" type="button" data-edit-id="${user.id}">${ICON.edit} ${I18N.t('common.edit')}</button>
                <button class="icon-btn--delete" type="button" data-delete-id="${user.id}" aria-label="${I18N.t('utenti.deleteAria')}">${ICON.trash}</button>
            </div>` : ''}
        </article>`;
    }

    function renderUsers(users) {
        const grid = document.getElementById('user-grid');
        if (users.length === 0) {
            grid.innerHTML = `<p class="state state--empty">${I18N.t('utenti.noneFound')}</p>`;
            return;
        }
        grid.innerHTML = users.map(renderUserCard).join('');

        if (!IS_ADMIN) return;

        grid.querySelectorAll('[data-edit-id]').forEach(btn => {
            btn.addEventListener('click', () => {
                const user = allUsers.find(u => u.id === Number(btn.dataset.editId));
                if (user) openEditModal(user);
            });
        });

        grid.querySelectorAll('[data-delete-id]').forEach(btn => {
            btn.addEventListener('click', () => {
                const user = allUsers.find(u => u.id === Number(btn.dataset.deleteId));
                if (user) openDeleteModal(user);
            });
        });
    }

    /* ──────────────────────────────────────────────────────
       MODALE — Crea / Modifica utente
    ────────────────────────────────────────────────────── */

    function openCreateModal() {
        editingUserId = null;
        document.getElementById('edit-modal-title').textContent = I18N.t('utenti.createModalTitle');
        document.getElementById('edit-form').reset();
        document.getElementById('edit-password-group').hidden = false;
        // form.reset() non tocca l'attributo "type": se l'utente aveva lasciato
        // la password in chiaro nell'apertura precedente, va nascosta di nuovo.
        resetPasswordToggle();
        document.getElementById('edit-save-btn').lastChild.textContent = ' ' + I18N.t('common.create');
        document.getElementById('edit-form-error').hidden = true;
        document.getElementById('edit-modal-overlay').hidden = false;
    }

    function openEditModal(user) {
        editingUserId = user.id;
        document.getElementById('edit-modal-title').textContent = I18N.t('utenti.editModalTitle');
        document.getElementById('edit-nome').value = user.name;
        document.getElementById('edit-email').value = user.email;
        document.getElementById('edit-area').value = user.area;
        document.getElementById('edit-password').value = '';
        document.getElementById('edit-is-admin').checked = user.isAdmin;
        document.getElementById('edit-password-group').hidden = true;
        document.getElementById('edit-save-btn').lastChild.textContent = ' ' + I18N.t('common.save');
        document.getElementById('edit-form-error').hidden = true;
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
            fullName: document.getElementById('edit-nome').value.trim(),
            email: document.getElementById('edit-email').value.trim(),
            area: document.getElementById('edit-area').value.trim(),
            password: document.getElementById('edit-password').value,
            isAdmin: document.getElementById('edit-is-admin').checked
        };

        saveBtn.disabled = true;
        try {
            const isEditing = !!editingUserId;
            if (isEditing) {
                await apiUpdateUser(editingUserId, payload);
            } else {
                await apiCreateUser(payload);
            }
            closeEditModal();
            await loadUsers();
            Toast.success(isEditing ? I18N.t('utenti.updatedSuccess') : I18N.t('utenti.createdSuccess'));
        } catch (err) {
            const message = err.message || I18N.t('utenti.saveError');
            errorEl.textContent = message;
            errorEl.hidden = false;
            Toast.error(message);
            console.error('[onSubmitEditForm]', err);
        } finally {
            saveBtn.disabled = false;
        }
    }

    /* ──────────────────────────────────────────────────────
       MODALE — Elimina utente
    ────────────────────────────────────────────────────── */

    let userPendingDelete = null;

    function openDeleteModal(user) {
        userPendingDelete = user;
        document.getElementById('delete-user-name').textContent = user.name;
        document.getElementById('delete-form-error').hidden = true;
        document.getElementById('delete-modal-overlay').hidden = false;
    }

    function closeDeleteModal() {
        document.getElementById('delete-modal-overlay').hidden = true;
    }

    async function onConfirmDelete() {
        if (!userPendingDelete) return;
        const confirmBtn = document.getElementById('delete-confirm-btn');
        const errorEl = document.getElementById('delete-form-error');
        errorEl.hidden = true;
        confirmBtn.disabled = true;
        try {
            await apiDeleteUser(userPendingDelete.id);
            closeDeleteModal();
            await loadUsers();
            Toast.success(I18N.t('utenti.deletedSuccess'));
        } catch (err) {
            const message = err.message || I18N.t('utenti.deleteError');
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

    async function loadUsers(query = '') {
        const grid = document.getElementById('user-grid');
        if (!query) grid.innerHTML = `<p class="state state--loading">${I18N.t('common.loading')}</p>`;
        try {
            allUsers = await apiGetUsers(query);
            renderUsers(allUsers);
        } catch (err) {
            grid.innerHTML = `<p class="state state--error">${I18N.t('common.errorLoadingRetry')}</p>`;
            console.error('[loadUsers]', err);
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
        searchTimer = setTimeout(() => loadUsers(e.target.value.trim()), 280);
    }

    /* ──────────────────────────────────────────────────────
       INIT
    ────────────────────────────────────────────────────── */

    document.addEventListener('DOMContentLoaded', async () => {
        const canAccess = CURRENT_USER && (IS_ADMIN || await Session.isManager());
        if (!canAccess) {
            location.href = 'dashboard.html';
            return;
        }

        await Promise.all([loadUser(), loadUsers()]);
        resetPasswordToggle = setupPasswordToggle('edit-password', 'edit-password-toggle');
        document.getElementById('search-input').addEventListener('input', onSearch);
        document.getElementById('new-user-btn').hidden = !IS_ADMIN;
        if (IS_ADMIN) {
            document.getElementById('new-user-btn').addEventListener('click', openCreateModal);
        }
        document.getElementById('logout-btn').addEventListener('click', Session.logout);

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
        loadUsers(document.getElementById('search-input').value.trim());
    });

})();
