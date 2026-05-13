// admin-pedidos.js
async function loadOrders() {
    try {
        const res = await fetch('/api/admin/orders');
        const orders = await res.json();
        const tbody = document.getElementById('orders-tbody');
        tbody.innerHTML = '';

        if(orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Nenhum pedido cadastrado.</td></tr>';
            return;
        }

        orders.forEach(o => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${o.id}</td>
                <td>${o.client_name || 'Desconhecido'}</td>
                <td>${new Date(o.created_at).toLocaleDateString()}</td>
                <td><span class="status-badge">${o.status}</span></td>
                <td>R$ ${parseFloat(o.total).toFixed(2).replace('.', ',')}</td>
                <td><span class="action-link">Ver Detalhes</span></td>
            `;
            tbody.appendChild(tr);
        });
    } catch(e) {
        console.error('Erro ao buscar pedidos:', e);
    }
}

document.addEventListener('DOMContentLoaded', loadOrders);
