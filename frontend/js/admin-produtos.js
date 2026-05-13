// admin-produtos.js
let produtos = [];

async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        produtos = await response.json();
        renderTable();
    } catch (error) {
        console.error('Error:', error);
    }
}

function formatCategory(cat) {
    const cats = {
        'burgers': 'Hambúrgueres',
        'acompanhamentos': 'Acompanhamentos',
        'bebidas': 'Bebidas',
        'sobremesas': 'Sobremesas',
        'saladas': 'Saladas',
        'sanduiches': 'Sanduíches'
    };
    return cats[cat] || cat || 'Geral';
}

function renderTable() {
    const tbody = document.getElementById('products-tbody');
    tbody.innerHTML = '';

    if (produtos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #888;">Nenhum produto cadastrado.</td></tr>';
        return;
    }

    produtos.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="text-align:center;">
                <img src="${p.image || 'https://via.placeholder.com/45'}" alt="${p.name}" style="width:40px; height:40px; object-fit:cover; border-radius:50%;">
            </td>
            <td style="font-weight:500;">${p.name}</td>
            <td style="color:#666; font-size:0.85rem; max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.description || '-'}</td>
            <td style="font-weight:600;">R$ ${parseFloat(p.price).toFixed(2).replace('.', ',')}</td>
            <td><span style="background:#f1f3f5; padding:4px 10px; border-radius:20px; font-size:0.8rem;">${formatCategory(p.category)}</span></td>
            <td>
                <span class="action-link" style="color:#222; font-weight:700;" onclick="editProduct(${p.id})">Edit</span> |
                <span class="action-link" style="color:#222; font-weight:700;" onclick="removeProduct(${p.id})">Remove</span>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function editProduct(id) {
    const p = produtos.find(item => item.id === id);
    if (!p) return;
    document.getElementById('form-title').textContent = 'Editar Produto';
    document.getElementById('product-id').value = p.id;
    document.getElementById('p-name').value = p.name;
    document.getElementById('p-desc').value = p.description || '';
    document.getElementById('p-price').value = p.price;
    document.getElementById('p-category').value = p.category || '';
    document.getElementById('p-image').value = p.image || '';
    
    document.getElementById('inline-product-form-container').scrollIntoView({ behavior: 'smooth' });
}

async function removeProduct(id) {
    const isConfirmed = await window.UI.confirm('Tem certeza que deseja remover este produto?', 'Atenção');
    if(!isConfirmed) return;
    try {
        const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
        if(res.ok) {
            window.UI.toast('Produto removido com sucesso!', 'success');
            loadProducts();
        } else {
            window.UI.toast('Erro ao remover produto.', 'error');
        }
    } catch(e) { console.error(e); window.UI.toast('Falha na conexão.', 'error'); }
}

async function saveProduct(event) {
    if(event) event.preventDefault();

    const id = document.getElementById('product-id').value;
    const product = {
        name: document.getElementById('p-name').value,
        description: document.getElementById('p-desc').value,
        price: document.getElementById('p-price').value,
        category: document.getElementById('p-category').value,
        image: document.getElementById('p-image').value,
        status: 'Disponível'
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/products/${id}` : '/api/products';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product)
        });

        if (response.ok) {
            window.UI.toast('Produto salvo com sucesso!', 'success');
            resetForm();
            loadProducts();
        } else {
            const data = await response.json();
            window.UI.toast('Erro: ' + (data.error || 'Falha ao salvar.'), 'error');
        }
    } catch (error) {
        console.error('Save error:', error);
        window.UI.toast('Erro ao salvar produto.', 'error');
    }
}

function resetForm() {
    document.getElementById('form-title').textContent = 'Adicionar novo produto';
    document.getElementById('product-id').value = '';
    document.getElementById('product-form').reset();
}

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    document.getElementById('product-form').addEventListener('submit', saveProduct);
});
