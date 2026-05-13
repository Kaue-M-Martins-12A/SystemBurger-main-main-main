let allProducts = [];

async function loadProducts() {
    try {
        const res = await fetch('/api/products');
        allProducts = await res.json();
        filterCategory('burgers', document.querySelector('.tab-btn.active'));
    } catch (err) {
        console.error('Erro ao carregar produtos:', err);
        document.getElementById('menu-grid').innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #e01a1a;">Erro ao carregar o cardápio. Tente novamente mais tarde.</p>';
    }
}

function filterCategory(category, btn) {
    // Update tabs
    const btns = document.querySelectorAll('.tab-btn');
    btns.forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    // Render matching products
    const grid = document.getElementById('menu-grid');
    const filtered = allProducts.filter(p => p.category === category && (p.status === 'Disponível' || !p.status));

    if (filtered.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: #666;">Nenhum produto nesta categoria.</p>';
        return;
    }

    grid.innerHTML = filtered.map(p => `
        <div class="product-card visible" data-category="${p.category}" onclick="Product.showDetails(${JSON.stringify(p).replace(/"/g, '&quot;')})" style="cursor: pointer;">
            <img src="${p.image}" alt="${p.name}" class="product-image">
            <div class="product-info">
                <h3 class="product-name">${p.name}</h3>
                <p class="product-desc">${p.description || ''}</p>
                <p style="font-weight: 700; color: var(--primary-red); margin-top: 10px;">R$ ${p.price.toFixed(2).replace('.', ',')}</p>
            </div>
        </div>
    `).join('');
}

document.addEventListener('DOMContentLoaded', loadProducts);
