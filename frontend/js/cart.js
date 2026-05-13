// Shopping cart management
const Cart = {
    getItems: () => {
        const items = JSON.parse(localStorage.getItem('burger_cart') || '[]');
        // Limpeza de segurança: remove itens com IDs inválidos (lixo de versões anteriores)
        const cleanItems = items.filter(item => !isNaN(parseInt(item.id)));
        if (cleanItems.length !== items.length) {
            localStorage.setItem('burger_cart', JSON.stringify(cleanItems));
        }
        return cleanItems;
    },

    saveItems: (items) => {
        localStorage.setItem('burger_cart', JSON.stringify(items));
        Cart.updateCartCount();
    },

    addItem: (product) => {
        const items = Cart.getItems();
        const existing = items.find(item => item.id === product.id);
        if (existing) {
            existing.quantity += 1;
        } else {
            items.push({ ...product, quantity: 1 });
        }
        Cart.saveItems(items);
        window.UI.toast(`${product.name} adicionado ao carrinho!`, 'success');
    },

    removeItem: (productId) => {
        const items = Cart.getItems().filter(item => item.id !== productId);
        Cart.saveItems(items);
        if (typeof renderCart === 'function') renderCart();
    },

    updateQuantity: (productId, delta) => {
        const items = Cart.getItems();
        const item = items.find(i => i.id === productId);
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) {
                Cart.removeItem(productId);
            } else {
                Cart.saveItems(items);
            }
        }
        if (typeof renderCart === 'function') renderCart();
    },

    updateCartCount: () => {
        const countElement = document.getElementById('cart-count');
        if (!countElement) return;
        const totalItems = Cart.getTotalItems();
        countElement.textContent = totalItems;
        countElement.style.display = totalItems > 0 ? 'flex' : 'none';
    },

    getTotalItems: () => {
        return Cart.getItems().reduce((sum, item) => sum + item.quantity, 0);
    },

    checkout: async () => {
        if (!Auth.isLoggedIn()) {
            await window.UI.alert('Você precisa estar logado para finalizar a compra!');
            window.location.href = '/login';
            return;
        }

        const items = Cart.getItems();
        if (items.length === 0) {
            window.UI.toast('Seu carrinho está vazio.', 'error');
            return;
        }

        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items })
            });

            const data = await res.json();
            if (res.ok) {
                await window.UI.alert('Pedido finalizado com sucesso!');
                localStorage.removeItem('burger_cart');
                window.location.href = '/perfil';
            } else {
                window.UI.toast(data.error || 'Erro ao finalizar pedido.', 'error');
            }
        } catch (error) {
            window.UI.toast('Erro de conexão ao finalizar pedido.', 'error');
        }
    }
};

document.addEventListener('DOMContentLoaded', Cart.updateCartCount);
window.Cart = Cart;
