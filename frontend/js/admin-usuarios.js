// admin-usuarios.js
let currentViewUserId = null;

async function loadUsers() {
    try {
        const res = await fetch('/api/admin/users');
        const users = await res.json();
        const tbody = document.getElementById('users-tbody');
        tbody.innerHTML = '';

        users.forEach(u => {
            const badgeStyle = u.blocked ? 'background:#ffe3e3; color:#dc3545;' : (u.online ? 'background:#d4edda; color:#28a745;' : 'background:#e9ecef;');
            const badgeText = u.blocked ? 'Bloqueado' : (u.online ? 'Online' : 'Offline');
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${u.name}</td>
                <td>${u.email}</td>
                <td><span class="status-badge" style="${badgeStyle}">${badgeText}</span></td>
                <td><span class="action-link" onclick="viewUser(${u.id})">Visualizar</span></td>
            `;
            tbody.appendChild(tr);
        });
    } catch(e) {}
}

async function viewUser(id) {
    currentViewUserId = id;
    try {
        const res = await fetch(`/api/admin/users/${id}`);
        const data = await res.json();
        const u = data.user;
        
        document.getElementById('u-name').textContent = u.name;
        document.getElementById('u-email').textContent = u.email;
        document.getElementById('u-address').textContent = u.address || 'Não informado';
        
        const badgeStyle = u.blocked ? 'color:#dc3545;' : (u.online ? 'color:#28a745;' : 'color:#888;');
        const badgeText = u.blocked ? 'Bloqueado' : (u.online ? 'Online Agora' : 'Offline / Ativo');
        document.getElementById('u-status').innerHTML = `<strong style="${badgeStyle}">${badgeText}</strong>`;
        
        document.getElementById('u-frequent').innerHTML = data.frequentItems.length > 0 ? 
            data.frequentItems.map(i => `<li>${i.count}x ${i.name}</li>`).join('') : '<li>Nenhum item comprado.</li>';
        
        document.getElementById('u-cart').innerHTML = data.cartItems.length > 0 ? 
            data.cartItems.map(i => `<li>${i.quantity}x ${i.name}</li>`).join('') : '<li>Carrinho vazio.</li>';
        
        const tbody = document.getElementById('u-history');
        if(data.orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Nenhuma compra</td></tr>';
        } else {
            tbody.innerHTML = data.orders.map(o => `
                <tr>
                    <td>#${o.id}</td>
                    <td>${new Date(o.created_at).toLocaleDateString()}</td>
                    <td>${o.status}</td>
                    <td>R$ ${parseFloat(o.total).toFixed(2).replace('.', ',')}</td>
                </tr>
            `).join('');
        }

        document.getElementById('user-overlay').style.display = 'flex';
    } catch(e) {
        window.UI.toast('Erro ao carregar os dados do usuário.', 'error');
    }
}

async function promptBlockUser() {
    if (!currentViewUserId) return;
    const password = await window.UI.prompt('Informe a SENHA DE ADMINISTRADOR para bloquear/desbloquear o usuário:', 'Autorização Pendente');
    if (!password) return;

    try {
        const res = await fetch(`/api/admin/users/${currentViewUserId}/block`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adminPassword: password })
        });
        const data = await res.json();
        if (res.ok) {
            window.UI.toast(data.message, 'success');
            viewUser(currentViewUserId); // Recarregar modal
            loadUsers(); // Recarregar tabela
        } else {
            window.UI.toast('Erro: ' + data.error, 'error');
        }
    } catch(e) {
        window.UI.toast('Falha ao conectar com o servidor.', 'error');
    }
}

function closeUserModal() {
    document.getElementById('user-overlay').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', loadUsers);
