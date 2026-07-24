const Session = (() => {
    'use strict';

    const STORAGE_KEY = 'currentUser';

    function getUser() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    function setUser(user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    }

    function requireLogin() {
        const user = getUser();
        if (!user) {
            location.href = 'login.html';
            return null;
        }
        return user;
    }

    function logout() {
        localStorage.removeItem(STORAGE_KEY);
        location.href = 'login.html';
    }

    // Il backend è JWT stateless (SecurityConfig: SessionCreationPolicy.STATELESS):
    // ogni richiesta alle API protette deve portare il token ricevuto da /auth/login
    // nell'header Authorization, altrimenti viene rifiutata come non autenticata.
    function authFetch(url, options = {}) {
        const user = getUser();
        const headers = { ...(options.headers || {}) };
        if (user && user.token) headers.Authorization = `Bearer ${user.token}`;
        return fetch(url, { ...options, headers });
    }

    // Un utente ha "poteri di gestione" (vede la pagina Utenti, in sola lettura se
    // non admin) se è amministratore globale oppure Capoprogetto su almeno un
    // progetto (Associato.ruolo diverso da "Dipendente").
    async function isManager() {
        const user = getUser();
        if (!user) return false;
        if (user.isAdmin) return true;
        try {
            const res = await authFetch(`/associati/dipendente/${user.idDipendente}`);
            if (!res.ok) return false;
            const associati = await res.json();
            return associati.some(a => (a.ruolo || '').toLowerCase() !== 'dipendente');
        } catch {
            return false;
        }
    }

    return { getUser, setUser, requireLogin, logout, isManager, authFetch };
})();

// Mostra/nasconde in chiaro il contenuto di un campo password: una sola icona
// (occhio) il cui contenuto SVG viene sostituito in base allo stato, non due
// icone sovrapposte. Condiviso da tutte le pagine con un campo password.
function setupPasswordToggle(inputId, toggleId) {
    const EYE_OPEN = '<path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"/><path fill-rule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.147.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>';
    const EYE_CLOSED = '<path fill-rule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.091 1.092a4 4 0 00-5.557-5.557z" clip-rule="evenodd"/><path d="M10.748 13.93l2.523 2.523a9.987 9.987 0 01-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.65 1.65 0 010-1.186A10.007 10.007 0 012.839 6.02L6.07 9.252a4 4 0 004.678 4.678z"/>';

    const input = document.getElementById(inputId);
    const toggle = document.getElementById(toggleId);
    if (!input || !toggle) return () => {};
    const icon = toggle.querySelector('.password-toggle__icon');

    function setVisible(visible) {
        input.type = visible ? 'text' : 'password';
        icon.innerHTML = visible ? EYE_CLOSED : EYE_OPEN;
        toggle.setAttribute('aria-pressed', String(visible));
        toggle.setAttribute('aria-label', visible ? I18N.t('common.hidePassword') : I18N.t('common.showPassword'));
    }

    toggle.addEventListener('click', () => setVisible(input.type === 'password'));
    // Se la lingua cambia mentre il campo è visibile/nascosto, l'aria-label va
    // ritradotta senza alterare lo stato di visibilità corrente.
    document.addEventListener('i18n:change', () => setVisible(input.type === 'text'));
    setVisible(false);

    // Da richiamare quando il campo torna visibile dopo essere stato nascosto
    // (es. riapertura di una modale), per non lasciarlo in chiaro da una volta precedente.
    return () => setVisible(false);
}

// Filtra dal vivo gli elementi di un checklist (renderChecklist/renderRadioList
// in progetti.js/progetti-dettaglio.js/attivita-generale.js) in base al testo
// digitato nella barra di ricerca associata, senza toccare lo stato dei
// checkbox/radio già selezionati (nasconde soltanto, non rimuove dal DOM).
function setupChecklistSearch(searchInputId, checklistId) {
    const input = document.getElementById(searchInputId);
    const checklist = document.getElementById(checklistId);
    if (!input || !checklist) return;

    input.addEventListener('input', () => {
        const q = input.value.trim().toLowerCase();
        checklist.querySelectorAll('.checklist__item').forEach(item => {
            const label = item.querySelector('.checklist__item-label');
            const text = label ? label.textContent.toLowerCase() : '';
            item.hidden = q.length > 0 && !text.includes(q);
        });
    });
}

// Conversione del tempo stimato tra minuti totali (formato interno, unico
// campo esistente sul backend) e la coppia valore+unità mostrata nei form di
// creazione/modifica attività (minuti/ore/giorni). 1 giorno = 8 ore lavorative,
// non 24h di calendario, coerente con una stima di sforzo di lavoro.
const MINUTES_PER_UNIT = { minuti: 1, ore: 60, giorni: 480 };

// Sceglie l'unità più "comoda" per mostrare un totale in minuti: preferisce
// giorni/ore quando il valore è un multiplo esatto, altrimenti minuti.
function minutesToValueUnit(totalMinutes) {
    const m = Number(totalMinutes) || 0;
    if (m > 0 && m % MINUTES_PER_UNIT.giorni === 0) return { value: m / MINUTES_PER_UNIT.giorni, unit: 'giorni' };
    if (m > 0 && m % MINUTES_PER_UNIT.ore === 0) return { value: m / MINUTES_PER_UNIT.ore, unit: 'ore' };
    return { value: m, unit: 'minuti' };
}

function valueUnitToMinutes(value, unit) {
    return Math.round((Number(value) || 0) * (MINUTES_PER_UNIT[unit] || 1));
}

// Notifiche toast per le operazioni di creazione/modifica/eliminazione, uguali
// su tutte le pagine. Autosufficiente: inietta da sé stile e contenitore nel
// DOM, così non serve toccare l'HTML/CSS di ogni singola pagina.
const Toast = (() => {
    'use strict';

    const PENDING_KEY = 'pendingToast';

    const ICONS = {
        success: '<svg class="toast__icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd"/></svg>',
        error: '<svg class="toast__icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd"/></svg>'
    };

    function injectStyles() {
        if (document.getElementById('toast-styles')) return;
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            #toast-container {
                position: fixed;
                bottom: 24px;
                right: 24px;
                z-index: 9999;
                display: flex;
                flex-direction: column-reverse;
                gap: 10px;
                pointer-events: none;
            }
            .toast {
                display: flex;
                align-items: center;
                gap: 10px;
                min-width: 260px;
                max-width: 380px;
                padding: 13px 14px 13px 16px;
                border-radius: 10px;
                background: #1e293b;
                color: #f8fafc;
                font-size: 14px;
                font-weight: 500;
                line-height: 1.4;
                box-shadow: 0 10px 28px rgba(0, 0, 0, 0.22);
                pointer-events: auto;
                opacity: 0;
                transform: translateY(10px);
                transition: opacity 0.25s ease, transform 0.25s ease;
            }
            .toast.is-visible { opacity: 1; transform: translateY(0); }
            .toast--success { background: #15803d; }
            .toast--error { background: #b91c1c; }
            .toast__icon { width: 18px; height: 18px; flex-shrink: 0; }
            .toast__message { flex: 1; }
            .toast__close {
                background: none;
                border: none;
                color: inherit;
                opacity: 0.75;
                cursor: pointer;
                padding: 2px;
                line-height: 0;
                flex-shrink: 0;
                font-size: 18px;
            }
            .toast__close:hover { opacity: 1; }
            @media (max-width: 640px) {
                #toast-container { left: 16px; right: 16px; bottom: 16px; }
                .toast { max-width: none; }
            }
        `;
        document.head.appendChild(style);
    }

    function ensureContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.setAttribute('aria-live', 'polite');
            container.setAttribute('aria-atomic', 'true');
            document.body.appendChild(container);
        }
        return container;
    }

    function show(message, type) {
        if (!message) return;
        injectStyles();
        const container = ensureContainer();

        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
        toast.innerHTML = `${ICONS[type] || ''}<span class="toast__message"></span><button class="toast__close" type="button" aria-label="${I18N.t('common.close')}">&times;</button>`;
        toast.querySelector('.toast__message').textContent = message;

        container.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('is-visible'));

        let dismissed = false;
        const dismiss = () => {
            if (dismissed) return;
            dismissed = true;
            toast.classList.remove('is-visible');
            setTimeout(() => toast.remove(), 250);
        };

        toast.querySelector('.toast__close').addEventListener('click', dismiss);
        setTimeout(dismiss, 4000);
    }

    // Usato prima di una navigazione (location.href = ...): il messaggio
    // sopravvive al cambio pagina e viene mostrato al caricamento successivo.
    function persist(message, type) {
        try {
            sessionStorage.setItem(PENDING_KEY, JSON.stringify({ message, type }));
        } catch {
            /* storage non disponibile: il toast va perso, non è bloccante */
        }
    }

    function showPending() {
        let raw;
        try {
            raw = sessionStorage.getItem(PENDING_KEY);
            if (!raw) return;
            sessionStorage.removeItem(PENDING_KEY);
            const { message, type } = JSON.parse(raw);
            show(message, type);
        } catch {
            /* niente da mostrare */
        }
    }

    document.addEventListener('DOMContentLoaded', showPending);

    return {
        success: (message) => show(message, 'success'),
        error: (message) => show(message, 'error'),
        successBeforeNavigate: (message) => persist(message, 'success'),
        errorBeforeNavigate: (message) => persist(message, 'error')
    };
})();
