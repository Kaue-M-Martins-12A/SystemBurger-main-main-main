// Product details and interaction
const Product = {
    showDetails: (product) => {
        let modal = document.getElementById('product-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'product-modal';
            modal.className = 'modal';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="modal-content">
                <span class="modal-close" onclick="Product.closeModal()">&times;</span>
                <img src="${product.image}" alt="${product.name}" class="modal-img">
                <h2 class="modal-title">${product.name}</h2>
                <p class="modal-price">R$ ${product.price.toFixed(2).replace('.', ',')}</p>
                <p class="modal-desc">${product.description || 'Nenhum detalhe adicional disponível.'}</p>
                <div class="modal-actions">
                    <button class="btn-primary" onclick="Cart.addItem(${JSON.stringify(product).replace(/"/g, '&quot;')}); Product.closeModal();">Adicionar ao Carrinho</button>
                    <button class="btn-secondary" onclick="Product.closeModal()">Sair</button>
                </div>
            </div>
        `;
        modal.style.display = 'flex';
    },

    closeModal: () => {
        const modal = document.getElementById('product-modal');
        if (modal) modal.style.display = 'none';
    },

    // Attach click events to product cards
    init: () => {
        // Seleciona cards que NÃO foram gerados dinamicamente com onclick
        const cards = document.querySelectorAll('.product-card:not([onclick])');
        cards.forEach(card => {
            card.style.cursor = 'pointer';
            card.addEventListener('click', (e) => {
                if (e.target.tagName === 'BUTTON') return;

                const name = card.querySelector('.product-name').textContent;
                const image = card.querySelector('img').src;
                const desc = card.querySelector('.product-desc').textContent;
                
                // Tenta pegar ID e Preço do dataset (se houver) ou usa fallback
                // Usando IDs numéricos para não quebrar o banco de dados
                const product = {
                    id: parseInt(card.dataset.id) || 1, 
                    name: name,
                    image: image,
                    description: desc,
                    price: parseFloat(card.dataset.price) || 25.00
                };
                Product.showDetails(product);
            });
        });
    }
};

document.addEventListener('DOMContentLoaded', Product.init);
window.Product = Product;
