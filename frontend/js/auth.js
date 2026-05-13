// Authentication state management
const Auth = {
    isLoggedInState: false,
    user: null,

    isLoggedIn: () => Auth.isLoggedInState,
    getUser: () => Auth.user || {},

    init: async () => {
        try {
            const res = await fetch('/api/auth/check');
            const data = await res.json();
            Auth.isLoggedInState = data.isLoggedIn;
            Auth.user = data.user || null;
            if (data.error === 'BLOCKED') {
                await window.UI.alert('Sua conta foi desativada pelo Administrador.', 'Aviso de Segurança');
                Auth.isLoggedInState = false;
            }
        } catch (e) {
            Auth.isLoggedInState = false;
        }
        Auth.updateHeader();

        // Custom event for pages that need auth info at startup (e.g. Profile)
        document.dispatchEvent(new Event('authLoaded'));
    },

    login: async (email, password) => {
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (res.ok) {
                window.location.href = '/';
            } else {
                window.UI.toast(data.error || 'Erro ao efetuar login', 'error');
            }
        } catch (error) {
            window.UI.toast('Erro na conexão com o servidor.', 'error');
        }
    },

    register: async (name, email, password) => {
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            const data = await res.json();
            if (res.ok) {
                window.location.href = '/';
            } else {
                window.UI.toast(data.error || 'Erro ao efetuar cadastro', 'error');
            }
        } catch (error) {
            window.UI.toast('Erro na conexão com o servidor.', 'error');
        }
    },

    logout: async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/';
        } catch (error) {
            window.UI.toast('Erro ao sair da conta', 'error');
        }
    },

    updateHeader: () => {
        if (window.Components) {
            window.Components.renderHeader();
        } else {
            console.warn('Components.js not loaded, skipping header update');
        }
    }
};

// Initialize auth state automatically on page load
document.addEventListener('DOMContentLoaded', Auth.init);
window.Auth = Auth;
