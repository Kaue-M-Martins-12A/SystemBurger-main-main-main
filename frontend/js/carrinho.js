function renderCart() {
    const items = Cart.getItems();
    const container = document.getElementById('cart-content');
    const summary = document.getElementById('cart-summary');

    if (items.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <p style="margin-bottom: 20px; font-size: 1.2rem; color: #666;">Seu carrinho está vazio.</p>
                <a href="/cardapio" class="btn-primary">Ver Cardápio</a>
            </div>
        `;
        summary.style.display = 'none';
        return;
    }

    summary.style.display = 'block';
    let html = '';
    let total = 0;

    items.forEach(item => {
        total += item.price * item.quantity;
        html += `
            <div class="cart-item">
                <img src="${item.image}" class="cart-item-img">
                <div class="cart-item-info">
                    <h3 style="font-size: 1.1rem; font-weight: 700;">${item.name}</h3>
                    <p style="color: var(--primary-red); font-weight: 700; margin-top: 5px;">R$ ${item.price.toFixed(2).replace('.', ',')}</p>
                </div>
                <div class="cart-item-actions">
                    <button class="qty-btn" onclick="Cart.updateQuantity('${item.id}', -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="qty-btn" onclick="Cart.updateQuantity('${item.id}', 1)">+</button>
                    <span class="remove-link" onclick="Cart.removeItem('${item.id}')">Remover</span>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    document.getElementById('cart-total-value').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

document.addEventListener('DOMContentLoaded', renderCart);
window.renderCart = renderCart;
