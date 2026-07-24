(() => {
    'use strict';

    const BASE_URL = '';

    async function apiLogin(email, password) {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!res.ok) {
            if (res.status === 401) throw new Error(I18N.t('login.errorInvalid'));
            throw new Error(I18N.t('common.errorApi', {status: res.status}));
        }
        return res.json();
    }

    async function onSubmit(e) {
        e.preventDefault();
        const submitBtn = document.getElementById('login-submit-btn');
        const errorEl = document.getElementById('login-form-error');
        errorEl.hidden = true;

        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        submitBtn.disabled = true;
        try {
            const user = await apiLogin(email, password);
            Session.setUser(user);
            location.href = 'dashboard.html';
        } catch (err) {
            errorEl.textContent = err.message || I18N.t('login.errorGeneric');
            errorEl.hidden = false;
            console.error('[login]', err);
        } finally {
            submitBtn.disabled = false;
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        if (Session.getUser()) {
            location.href = 'dashboard.html';
            return;
        }
        document.getElementById('login-form').addEventListener('submit', onSubmit);
        setupPasswordToggle('login-password', 'login-password-toggle');
    });
})();
