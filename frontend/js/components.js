/**
 * SystemBurger Components
 * Handles dynamic rendering of Header and Footer
 */

window.UI = {
    _overlay: null,
    _toastContainer: null,

    init: function() {
        this._overlay = document.createElement('div');
        this._overlay.className = 'ui-overlay';
        this._overlay.innerHTML = '<div class="ui-modal" id="ui-modal-box"></div>';
        document.body.appendChild(this._overlay);

        this._toastContainer = document.createElement('div');
        this._toastContainer.className = 'ui-toast-container';
        document.body.appendChild(this._toastContainer);
    },

    showModal: function(opts) {
        return new Promise((resolve) => {
            if (!this._overlay) this.init();
            const box = document.getElementById('ui-modal-box');
            
            let html = '';
            if (opts.title) html += `<h3>${opts.title}</h3>`;
            if (opts.text) html += `<p>${opts.text}</p>`;
            if (opts.type === 'prompt') {
                html += `<input type="text" id="ui-prompt-input" autocomplete="off" />`;
            }
            
            html += '<div class="ui-buttons">';
            if (opts.showCancel) {
                html += `<button class="ui-btn ui-btn-secondary" id="ui-btn-cancel">Cancelar</button>`;
            }
            html += `<button class="ui-btn ui-btn-primary" id="ui-btn-confirm">OK</button>`;
            html += '</div>';

            box.innerHTML = html;

            const close = (val) => {
                this._overlay.classList.remove('show');
                setTimeout(() => { resolve(val); }, 300);
            };


            // Force reflow
            void this._overlay.offsetWidth;
            this._overlay.classList.add('show');

            document.getElementById('ui-btn-confirm').onclick = () => {
                if (opts.type === 'prompt') {
                    close(document.getElementById('ui-prompt-input').value);
                } else {
                    close(true);
                }
            };

            if (opts.showCancel) {
                document.getElementById('ui-btn-cancel').onclick = () => close(false);
            }

            if (opts.type === 'prompt') {
                document.getElementById('ui-prompt-input').focus();
            }
        });
    },

    alert: function(text, title = 'Aviso') {
        return this.showModal({ title, text, type: 'alert', showCancel: false });
    },

    confirm: function(text, title = 'Confirmação') {
        return this.showModal({ title, text, type: 'confirm', showCancel: true });
    },

    prompt: function(text, title = 'Entrada') {
        return this.showModal({ title, text, type: 'prompt', showCancel: true });
    },

    toast: function(text, type = 'info') {
        if (!this._toastContainer) this.init();
        const toast = document.createElement('div');
        toast.className = `ui-toast ${type}`;
        
        let icon = type === 'success' ? '✓' : (type === 'error' ? '✕' : 'ℹ');
        toast.innerHTML = `<span style="font-weight:bold; font-size:1.2rem">${icon}</span> <span>${text}</span>`;
        
        this._toastContainer.appendChild(toast);
        
        // Reflow
        void toast.offsetWidth;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// Override globais para fallback (podem não bloquear a execução se não usar await)
window._originalAlert = window.alert;
window.alert = (msg) => {
    window.UI.toast(msg, msg && msg.toLowerCase().includes('erro') ? 'error' : 'info');
};
window.confirm = (msg) => {
    // Síncrona não pode ser bloqueada facilmente por custom UI.
    // Vamos lançar o alert original como fallback ou usar o async
    console.warn('Uso de window.confirm síncrono. Use await window.UI.confirm()');
    return window._originalConfirm ? window._originalConfirm(msg) : true;
};
window._originalConfirm = window.confirm;
window._originalPrompt = window.prompt;
window.prompt = (msg) => {
    console.warn('Uso de window.prompt síncrono. Use await window.UI.prompt()');
    return window._originalPrompt ? window._originalPrompt(msg) : '';
};


const Components = {
    renderHeader: function() {
        const header = document.getElementById('main-header');
        if (!header) return;

        header.className = 'main-header';
        header.innerHTML = `
            <div class="logo">
                <a href="/" style="display: flex; align-items: center; gap: 8px; color: inherit; text-decoration: none;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 13.5C3 12.6716 3.67157 12 4.5 12H19.5C20.3284 12 21 12.6716 21 13.5C21 14.3284 20.3284 15 19.5 15H4.5C3.67157 15 3 14.3284 3 13.5Z" />
                        <path d="M4.5 17C3.67157 17 3 17.6716 3 18.5C3 19.3284 3.67157 20 4.5 20H19.5C20.3284 20 21 19.3284 21 18.5C21 17.6716 20.3284 17 19.5 17H4.5Z" />
                        <path d="M21 9C21 5.13401 16.9706 2 12 2C7.02944 2 3 5.13401 3 9C3 9.55228 3.44772 10 4 10H20C20.5523 10 21 9.55228 21 9Z" />
                    </svg>
                    <span>Burger</span>
                </a>
            </div>
            <nav class="nav-links">
                <a href="/cardapio">Menu</a>
                <a href="/#promocoes">Promoções</a>
                <a href="/contato">Contato</a>
            </nav>
            <div class="header-actions">
                <a href="/carrinho" id="cart-link" title="Carrinho">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                    <span id="cart-count">0</span>
                </a>
                <a href="/perfil" title="Meu Perfil">
                    <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=40&q=80" alt="Profile" class="profile-img" id="header-profile-img">
                </a>
            </div>
        `;

        // Update cart count if Cart object exists
        if (window.Cart) {
            const count = window.Cart.getTotalItems();
            const badge = document.getElementById('cart-count');
            if (badge) badge.textContent = count;
        }

        // Update profile image if Auth object exists and user is logged in
        if (window.Auth && window.Auth.isLoggedIn()) {
            const user = window.Auth.getUser();
            if (user && user.profile_picture) {
                const img = document.getElementById('header-profile-img');
                if (img) img.src = user.profile_picture;
            }

            // Floating Admin Switcher Button
            if (user && user.email === 'ADM2026@gmail.com') {
                if(!document.getElementById('admin-float-btn')) {
                    const btn = document.createElement('a');
                    btn.id = 'admin-float-btn';
                    btn.href = '/admin';
                    btn.innerHTML = '⚙️ Painel Admin';
                    btn.style.cssText = 'position: fixed; bottom: 30px; left: 30px; background: #e63946; color: white; padding: 14px 24px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 15px; box-shadow: 0 4px 15px rgba(230,57,70,0.4); z-index: 10000; display: flex; align-items: center; gap: 8px; transition: transform 0.2s ease, background 0.2s ease; cursor: pointer;';
                    btn.onmouseover = () => { btn.style.transform = 'translateY(-2px)'; btn.style.background = '#d90429'; };
                    btn.onmouseout = () => { btn.style.transform = 'translateY(0)'; btn.style.background = '#e63946'; };
                    
                    document.body.appendChild(btn);
                }
            }
        }
    },

    renderFooter: function() {
        const footer = document.getElementById('main-footer');
        if (!footer) return;

        footer.className = 'main-footer';
        footer.innerHTML = `
            <div class="footer-nav">
                <a href="/cardapio">Cardápio</a>
                <a href="#">Sobre</a>
                <a href="/contato">Contato</a>
                <a href="#">Política de Privacidade</a>
                <a href="#">Termos de Serviço</a>
            </div>
            <div class="social-icons">
                <a href="#" title="Instagram">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                </a>
                <a href="#" title="Facebook">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                    </svg>
                </a>
                <a href="#" title="Twitter">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                    </svg>
                </a>
            </div>
            <p style="font-size: 0.8rem; color: #6C757D; margin-top: 20px;">© 2025 Burger . Todos os direitos reservados.</p>
        `;
    },

    init: function() {
        this.renderHeader();
        this.renderFooter();
    }
};

document.addEventListener('DOMContentLoaded', () => Components.init());
window.Components = Components;
