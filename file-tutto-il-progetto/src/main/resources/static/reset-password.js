(() => {
    'use strict';

    /* ________________________________________________________________________________________________________________________

    STRATO DI ACCESSO API — chiama il backend reale (Spring Boot).
    _________________________________________________________________________________________________________________________
    Endpoint usati:
        POST /auth/reset-password

    Pagina raggiunta dal link generato da password-dimenticata.html
    (reset-password.html?token=...): il token identifica univocamente la
    richiesta di reset e ha una scadenza gestita lato backend.
    ────────────────────────────────────────────────────── */

    const BASE_URL = '';

    async function apiResetPassword(token, nuovaPassword) {
        const res = await fetch(`${BASE_URL}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, nuovaPassword })
        });
        if (!res.ok) {
            let message = I18N.t('common.errorApi', {status: res.status});
            try {
                const body = await res.json();
                if (body && body.messaggio) message = body.messaggio;
            } catch { /* risposta senza corpo JSON */ }
            throw new Error(message);
        }
    }

    async function onSubmit(e) {
        e.preventDefault();
        const submitBtn = document.getElementById('reset-submit-btn');
        const errorEl = document.getElementById('reset-form-error');
        errorEl.hidden = true;

        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const password = document.getElementById('reset-password').value;
        const passwordConfirm = document.getElementById('reset-password-confirm').value;

        if (!token) {
            errorEl.textContent = I18N.t('reset.errorNoToken');
            errorEl.hidden = false;
            return;
        }
        if (password !== passwordConfirm) {
            errorEl.textContent = I18N.t('reset.errorMismatch');
            errorEl.hidden = false;
            return;
        }

        submitBtn.disabled = true;
        try {
            await apiResetPassword(token, password);
            Toast.successBeforeNavigate(I18N.t('reset.successToast'));
            location.href = 'login.html';
        } catch (err) {
            errorEl.textContent = err.message || I18N.t('reset.errorGeneric');
            errorEl.hidden = false;
            console.error('[reset-password]', err);
        } finally {
            submitBtn.disabled = false;
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        if (!new URLSearchParams(location.search).get('token')) {
            const errorEl = document.getElementById('reset-form-error');
            errorEl.textContent = I18N.t('reset.errorInvalidLink');
            errorEl.hidden = false;
        }
        document.getElementById('reset-form').addEventListener('submit', onSubmit);
        setupPasswordToggle('reset-password', 'reset-password-toggle');
        setupPasswordToggle('reset-password-confirm', 'reset-password-confirm-toggle');
    });
})();
