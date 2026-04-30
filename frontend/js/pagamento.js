document.addEventListener('authLoaded', async () => {
    if (!Auth.isLoggedIn()) {
        window.location.href = '/login';
        return;
    }

    // Load Address
    const user = Auth.getUser();
    const addressDisplay = document.getElementById('current-address');
    if (user.address) {
        addressDisplay.textContent = user.address;
    } else {
        addressDisplay.innerHTML = '<span style="color: #e01a1a;">Nenhum endereço cadastrado.</span> Clique em alterar para informar.';
    }

    // Render Cart Summary
    const items = Cart.getItems();
    const listContainer = document.getElementById('checkout-items-list');
    let total = 0;

    if (items.length === 0) {
        window.location.href = '/cardapio';
        return;
    }

    listContainer.innerHTML = items.map(item => {
        total += item.price * item.quantity;
        return `
            <div class="summary-item">
                <span>${item.name} (x${item.quantity})</span>
                <span>R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
            </div>
        `;
    }).join('');
    document.getElementById('final-total-value').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;

    // Address Change Logic
    const changeBtn = document.getElementById('change-address-btn');
    const editForm = document.getElementById('address-edit-form');
    const tempInput = document.getElementById('temp-address-input');
    const saveBtn = document.getElementById('save-temp-address');

    changeBtn.addEventListener('click', () => {
        const isEditing = editForm.style.display === 'block';
        editForm.style.display = isEditing ? 'none' : 'block';
        changeBtn.textContent = isEditing ? 'Alterar' : 'Cancelar';
        if (!isEditing) tempInput.value = user.address || '';
    });

    saveBtn.addEventListener('click', () => {
        const newAddress = tempInput.value.trim();
        if (newAddress) {
            addressDisplay.textContent = newAddress;
            editForm.style.display = 'none';
            changeBtn.textContent = 'Alterar';
            // Optional: Update user object in Auth state for this session
            user.address = newAddress;
        } else {
            window.UI.toast('Por favor, informe um endereço.', 'error');
        }
    });
});

function selectMethod(method, btn) {
    const options = document.querySelectorAll('.method-option');
    options.forEach(opt => opt.classList.remove('active'));
    btn.classList.add('active');

    const cardFields = document.getElementById('card-fields');
    const inputs = cardFields.querySelectorAll('input');

    if (method === 'credit') {
        cardFields.style.display = 'grid';
        inputs.forEach(input => input.required = true);
    } else {
        cardFields.style.display = 'none';
        inputs.forEach(input => input.required = false);
    }
}

document.getElementById('payment-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const address = document.getElementById('current-address').textContent;
    if (address.includes('Nenhum endereço')) {
        window.UI.toast('Por favor, confirme seu endereço de entrega.', 'error');
        return;
    }

    try {
        const items = Cart.getItems();
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items, address })
        });

        if (res.ok) {
            if (Cart.clear) Cart.clear();
            else localStorage.removeItem('burger_cart');
            await window.UI.alert('Pedido finalizado com sucesso! Seu Burger chegará em instantes.');
            window.location.href = '/';
        } else {
            const data = await res.json();
            window.UI.toast('Erro ao processar pedido: ' + data.error, 'error');
        }
    } catch (err) {
        window.UI.toast('Erro de conexão ao processar pedido.', 'error');
    }
});
