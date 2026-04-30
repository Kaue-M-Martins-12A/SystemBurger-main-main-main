CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    phone TEXT,
    profile_picture TEXT,
    address TEXT,
    is_blocked INTEGER DEFAULT 0,
    last_active DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    image TEXT,
    category TEXT,
    status TEXT DEFAULT 'Disponível',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    total REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pendente',
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

INSERT OR IGNORE INTO products (id, name, description, price, image, category) VALUES
(1, 'X-Burger Clássico', 'Hambúrguer de 180g, queijo cheddar, alface, tomate e molho especial.', 25.0, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=60', 'burgers'),
(2, 'Duplo Bacon', 'Dois hambúrgueres de 180g, muito queijo cheddar e fatias crocantes de bacon.', 32.0, 'https://images.unsplash.com/photo-1594212586737-08c407842dd7?auto=format&fit=crop&w=500&q=60', 'burgers'),
(3, 'Frango Crocante', 'Peito de frango empanado, maionese temperada e alface americana.', 22.0, 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=500&q=60', 'burgers'),
(4, 'Batata Frita', 'Porção individual de batatas fritas crocantes.', 12.0, 'https://images.unsplash.com/photo-1573080493719-44933d980456?auto=format&fit=crop&w=500&q=60', 'acompanhamentos'),
(5, 'Anéis de Cebola', 'Porção de anéis de cebola crocantes.', 15.0, 'https://images.unsplash.com/photo-1639024471283-035188835111?auto=format&fit=crop&w=500&q=60', 'acompanhamentos'),
(6, 'Refrigerante Lata', 'Lata 350ml (Coca-Cola, Guaraná, Fanta).', 6.0, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=500&q=60', 'bebidas'),
(7, 'Suco Natural', 'Suco de laranja feito na hora 400ml.', 8.0, 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=500&q=60', 'bebidas'),
(8, 'Brownie Especial', 'Brownie de chocolate belga com nozes.', 14.0, 'https://images.unsplash.com/photo-1589119908995-c6837fa14878?auto=format&fit=crop&w=500&q=60', 'sobremesas'),
(9, 'Milkshake Morango', 'Milkshake cremoso com calda de morango.', 18.0, 'https://images.unsplash.com/photo-1553787499-6f913386001c?auto=format&fit=crop&w=500&q=60', 'sobremesas');

INSERT OR IGNORE INTO users (id, name, email, password) VALUES
(1, 'Administrador', 'ADM2026@gmail.com', '$2b$10$nWA2paQwp3hO1dCyOiZZD.DSbNWm4vF/ob0XgaDS/aLd9NWLg73ga');
