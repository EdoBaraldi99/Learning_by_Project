(() => {
    'use strict';

    /* ________________________________________________________________________________________________________________________

    STRATO DI ACCESSO API — chiama il backend reale (Spring Boot).
    _________________________________________________________________________________________________________________________
    Endpoint usati:
        POST /auth/password-dimenticata

    NOTA — MODALITÀ SVILUPPO:
    Il backend non ha (ancora) un server SMTP configurato per inviare email reali.
    Per questo motivo /auth/password-dimenticata restituisce direttamente il token
    di reset nella risposta, che questa pagina mostra a schermo invece di inviarlo
    via email. Prima di un uso in produzione va sostituito con un invio email reale
    e la risposta dell'endpoint non dovrebbe più esporre il token al client.
    ────────────────────────────────────────────────────── */

    const BASE_URL = '';

    async function apiRichiediReset(email) {
        const res = await fetch(`${BASE_URL}/auth/password-dimenticata`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        if (!res.ok) {
            let message = I18N.t('common.errorApi', {status: res.status});
            try {
                const body = await res.json();
                if (body && body.messaggio) message = body.messaggio;
            } catch { /* risposta senza corpo JSON */ }
            throw new Error(message);
        }
        return res.json();
    }

    async function onSubmit(e) {
        e.preventDefault();
        const submitBtn = document.getElementById('forgot-submit-btn');
        const errorEl = document.getElementById('forgot-form-error');
        const devBox = document.getElementById('dev-reset-box');
        errorEl.hidden = true;
        devBox.hidden = true;

        const email = document.getElementById('forgot-email').value.trim();

        submitBtn.disabled = true;
        try {
            const result = await apiRichiediReset(email);
            const link = `${location.origin}/reset-password.html?token=${encodeURIComponent(result.resetToken)}`;
            document.getElementById('dev-reset-link').href = link;
            document.getElementById('dev-reset-link').textContent = link;
            devBox.hidden = false;
        } catch (err) {
            errorEl.textContent = err.message || I18N.t('forgot.errorGeneric');
            errorEl.hidden = false;
            console.error('[password-dimenticata]', err);
        } finally {
            submitBtn.disabled = false;
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        document.getElementById('forgot-form').addEventListener('submit', onSubmit);
    });
})();
