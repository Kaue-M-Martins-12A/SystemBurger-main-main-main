const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../config/database');

const JWT_SECRET = 'burger_secret_key_123'; // Em produção, usar variável de ambiente

// --- AUTENTICAÇÃO ---

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
        }

        const db = await getDb();
        const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email]);

        if (existingUser) {
            return res.status(400).json({ error: 'Este e-mail já está em uso.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await db.run(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );

        // Auto-login after register
        const token = jwt.sign({ id: result.lastID, name, email }, JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });

        res.json({ message: 'Cadastro realizado com sucesso!', user: { id: result.lastID, name, email } });
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ error: 'Erro interno no servidor ao cadastrar: ' + error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
        }

        const db = await getDb();
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        if (user.is_blocked) {
            return res.status(403).json({ error: 'Sua conta foi desativada pelo Administrador.' });
        }

        const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });

        res.json({
            message: 'Login realizado com sucesso!', user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                profile_picture: user.profile_picture
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno no servidor ao fazer login.' });
    }
};

exports.logout = (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logout realizado com sucesso!' });
};

// Middleware para verificar token
exports.authMiddleware = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Não autorizado.' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.clearCookie('token');
        return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }
};

// Middleware para administradores
exports.adminMiddleware = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.redirect('/login');

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.email !== 'ADM2026@gmail.com') {
            return res.redirect('/');
        }
        req.user = decoded;
        next();
    } catch (error) {
        res.clearCookie('token');
        return res.redirect('/login');
    }
};

// --- ADMIN API ---
exports.getAdminDashboard = async (req, res) => {
    try {
        const { range = 'week' } = req.query;
        const db = await getDb();
        
        // --- 1. KPIs Baseados no Período Selecionado ---
        let dateLimit = "";
        if (range === 'week') dateLimit = "DATE_SUB(NOW(), INTERVAL 7 DAY)";
        else if (range === 'month') dateLimit = "DATE_SUB(NOW(), INTERVAL 30 DAY)";
        else if (range === 'year') dateLimit = "DATE_SUB(NOW(), INTERVAL 1 YEAR)";

        const whereClause = dateLimit ? `WHERE created_at >= ${dateLimit} AND status != 'Cancelado'` : `WHERE status != 'Cancelado'`;
        // Version with table alias for JOIN queries (orders aliased as 'o')
        const whereClauseAliased = whereClause.replace(/created_at/g, 'o.created_at').replace(/status/g, 'o.status');

        const totalVendasRange = await db.get(`SELECT SUM(total) as t FROM orders ${whereClause}`);
        const totalPedidosRange = await db.get(`SELECT COUNT(*) as c FROM orders ${whereClause}`);
        const usersCount = (await db.get('SELECT COUNT(*) as c FROM users')).c || 0;
        const entregasCount = await db.get('SELECT COUNT(*) as c FROM orders WHERE status IN ("Em Preparo", "Em trânsito")');

        const vendas = parseFloat(totalVendasRange.t) || 0;
        const pedidos = parseInt(totalPedidosRange.c) || 0;

        // --- 2. Dados do Gráfico de Vendas (Linha) ---
        let salesQuery = "";
        if (range === 'week') {
            salesQuery = `
                SELECT DATE_FORMAT(created_at, '%d/%m') as label, SUM(total) as value 
                FROM orders 
                ${whereClause}
                GROUP BY label ORDER BY MIN(created_at) ASC
            `;
        } else if (range === 'month') {
            salesQuery = `
                SELECT CONCAT('Semana ', CEIL(DAY(created_at)/7)) as label, SUM(total) as value 
                FROM orders 
                ${whereClause}
                GROUP BY label ORDER BY MIN(created_at) ASC
            `;
        } else if (range === 'year') {
            salesQuery = `
                SELECT DATE_FORMAT(created_at, '%m/%Y') as label, SUM(total) as value 
                FROM orders 
                ${whereClause}
                GROUP BY label ORDER BY MIN(created_at) ASC
            `;
        }

        let salesData = await db.all(salesQuery);

        // Para a view semanal, gerar todos os 7 dias (UTC) com valores preenchidos
        if (range === 'week') {
            const rawMap = {};
            salesData.forEach(r => { rawMap[r.label] = r.value; });

            const filledDays = [];
            const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
            for (let i = 6; i >= 0; i--) {
                const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
                const dd = String(d.getDate()).padStart(2, '0');
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const key = `${dd}/${mm}`;
                filledDays.push({
                    label: key,
                    dayName: daysOfWeek[d.getDay()],
                    value: rawMap[key] || 0,
                    isToday: i === 0
                });
            }
            salesData = filledDays;
        } else {
            salesData = salesData.map(s => ({ ...s, value: parseFloat(s.value) || 0 }));
        }

        // --- 3. Itens Mais Vendidos por Nicho ---
        const topByNiche = await db.all(`
            SELECT p.category, MAX(p.name) as name, SUM(oi.quantity) as total_sold
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN products p ON oi.product_id = p.id
            ${whereClauseAliased}
            GROUP BY p.category
            ORDER BY total_sold DESC
        `);

        // --- 4. Top 5 Itens Geral (Para o Pie Chart) ---
        const topProductsTotal = await db.all(`
            SELECT p.name, SUM(oi.quantity) as value
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN products p ON oi.product_id = p.id
            ${whereClauseAliased}
            GROUP BY p.id, p.name
            ORDER BY value DESC
            LIMIT 5
        `);

        res.json({
            kpis: {
                vendas: vendas,
                mediaPedidos: pedidos > 0 ? (vendas / pedidos) : 0,
                clientesAtivos: parseInt(usersCount) || 0,
                entregasAndamento: parseInt(entregasCount.c) || 0
            },
            charts: {
                sales: salesData,
                niches: topByNiche,
                topProducts: topProductsTotal
            }
        });
    } catch (error) {
        console.error('Dash Error:', error);
        res.status(500).json({ error: 'Erro ao buscar dashboard.' });
    }
};

exports.getAdminUsers = async (req, res) => {
    try {
        const db = await getDb();
        const users = await db.all('SELECT id, name, email, is_blocked as blocked, last_active FROM users ORDER BY created_at DESC');
        
        // Define active status if user pinged in last 5 minutes
        const activeThreshold = new Date(Date.now() - 5 * 60000); 

        const parsedUsers = users.map(u => {
            let online = false;
            if (u.last_active) {
                const lp = new Date(u.last_active);
                if (lp > activeThreshold) online = true;
            }
            return { ...u, online };
        });

        res.json(parsedUsers);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar usuários.' });
    }
};

exports.getAdminUserDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const db = await getDb();
        
        // User basics
        const user = await db.get('SELECT id, name, email, address, is_blocked as blocked, last_active FROM users WHERE id = ?', [id]);
        if (!user) return res.status(404).json({ error: 'User not found' });
        let online = false;
        if (user.last_active && new Date(user.last_active) > new Date(Date.now() - 5 * 60000)) online = true;
        user.online = online;

        // Tenta pegar o último endereço usado em uma compra caso o endereço principal não exista
        if (!user.address) {
            const lastOrder = await db.get('SELECT address FROM orders WHERE user_id = ? AND address IS NOT NULL ORDER BY created_at DESC LIMIT 1', [id]);
            if (lastOrder) {
                user.address = lastOrder.address;
            }
        }

        // Historico de Compras
        const orders = await db.all('SELECT id, status, total, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC', [id]);

        // Itens no carrinho (na versão atual as compras simulam mas podemos buscar os itens dos orders recentes para "carrinho" se formos considerar session db. O sql tinha cart_items)
        const cartItems = await db.all('SELECT c.quantity, p.name FROM cart_items c JOIN products p ON c.product_id = p.id WHERE c.user_id = ?', [id]);

        // Itens mais comprados
        const frequentItems = await db.all(`
            SELECT p.name, SUM(oi.quantity) as count 
            FROM order_items oi 
            JOIN orders o ON oi.order_id = o.id 
            JOIN products p ON oi.product_id = p.id 
            WHERE o.user_id = ? 
            GROUP BY p.id, p.name 
            ORDER BY count DESC LIMIT 3
        `, [id]);

        res.json({ user, orders, cartItems, frequentItems });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao carregar detalhes do usuário.' });
    }
};

exports.blockUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { adminPassword } = req.body;

        // Verify admin password
        const db = await getDb();
        const adminUser = await db.get('SELECT password FROM users WHERE email = ?', ['ADM2026@gmail.com']);
        if (!adminUser) return res.status(401).json({ error: 'Admin root não encontrado.' });

        const isMatch = await bcrypt.compare(adminPassword, adminUser.password);
        if (!isMatch) return res.status(401).json({ error: 'Senha de administrador incorreta.' });

        const targetUser = await db.get('SELECT is_blocked FROM users WHERE id = ?', [id]);
        if (!targetUser) return res.status(404).json({ error: 'Usuário não encontrado.' });

        const newStatus = targetUser.is_blocked ? 0 : 1;
        await db.run('UPDATE users SET is_blocked = ? WHERE id = ?', [newStatus, id]);

        res.json({ message: newStatus ? 'Usuário bloqueado com sucesso.' : 'Usuário desbloqueado com sucesso.', is_blocked: newStatus });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao alterar status da conta.' });
    }
};

exports.getAllOrders = async (req, res) => {
    try {
        const db = await getDb();
        const orders = await db.all(`
            SELECT o.id, o.status, o.total, o.created_at, u.name as client_name 
            FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC
        `);
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar pedidos.' });
    }
};

// --- PERFIL ---

exports.getProfile = async (req, res) => {
    try {
        const db = await getDb();
        const user = await db.get('SELECT id, name, email, phone, profile_picture, address FROM users WHERE id = ?', [req.user.id]);
        if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao carregar perfil.' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { name, email, phone, address } = req.body;
        if (!name || !email) {
            return res.status(400).json({ error: 'Nome e email são obrigatórios.' });
        }

        const db = await getDb();

        // Verifica se o e-mail não foi pego por outra pessoa
        const existingUser = await db.get('SELECT id FROM users WHERE email = ? AND id != ?', [email, req.user.id]);
        if (existingUser) return res.status(400).json({ error: 'Este e-mail já está em uso.' });

        await db.run(
            'UPDATE users SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?',
            [name, email, phone || null, address || null, req.user.id]
        );

        res.json({ message: 'Perfil atualizado com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar perfil.' });
    }
};

// --- CARRINHO E COMPRAS ---

exports.saveOrder = async (req, res) => {
    try {
        const { items, address } = req.body; // Array de { id, quantity, price } e endereço
        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'Carrinho vazio.' });
        }

        const db = await getDb();
        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const userId = parseInt(req.user.id);
        console.log(`[DEBUG] Iniciando pedido para usuário ${userId}`);

        // Inicia a compra
        const result = await db.run(
            'INSERT INTO orders (user_id, total, status, address) VALUES (?, ?, ?, ?)',
            [userId, total, 'Aprovado', address || null]
        );
        const orderId = result.lastID;

        for (const item of items) {
            const pId = parseInt(item.id);
            console.log(`  -> Inserindo item: Produto ${pId}, Qtd ${item.quantity}`);
            await db.run(
                'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                [orderId, pId, item.quantity, item.price]
            );
        }

        res.json({ message: 'Pedido finalizado com sucesso!', orderId });
    } catch (error) {
        console.error('CRITICAL ERROR NO CHECKOUT:', error);
        res.status(500).json({ error: 'Erro interno ao salvar: ' + error.message });
    }
};

// ENDPOINT TEMPORÁRIO PARA TESTAR DASHBOARD (SEED)
exports.seedDashboard = async (req, res) => {
    try {
        const db = await getDb();
        
        // 1. Garantir Admin (ID 1)
        const admin = await db.get("SELECT id FROM users WHERE email = ?", ['ADM2026@gmail.com']);
        let userId = admin ? admin.id : 1;
        if (!admin) {
            const resAdmin = await db.run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', 
                ["Administrador", "ADM2026@gmail.com", "$2b$10$nWA2paQwp3hO1dCyOiZZD.DSbNWm4vF/ob0XgaDS/aLd9NWLg73ga"]);
            userId = resAdmin.lastID;
        }
        
        // 2. Garantir Produtos (1 a 3)
        const productsCount = (await db.get('SELECT COUNT(*) as c FROM products')).c;
        if (productsCount === 0) {
            await db.run('INSERT INTO products (name, price, category) VALUES ("Burger Teste", 25.0, "burgers")');
            await db.run('INSERT INTO products (name, price, category) VALUES ("Fritas Teste", 15.0, "acompanhamentos")');
            await db.run('INSERT INTO products (name, price, category) VALUES ("Soda Teste", 8.0, "bebidas")');
        }

        // 3. Criar vendas fakes para os últimos 7 dias
        // Limpar pedidos antigos para o gráfico ficar limpo e novo
        await db.run("DELETE FROM orders");
        await db.run("DELETE FROM order_items");

        for (let i = 6; i >= 0; i--) {
            // Criar pedidos em horários diferentes para cada dia
            const numOrders = Math.floor(Math.random() * 3) + 1;
            for (let j = 0; j < numOrders; j++) {
                const hour = Math.floor(Math.random() * 12) + 10;
                const dateString = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                const finalDate = `${dateString} ${hour}:00:00`;
                
                const total = Math.floor(Math.random() * 100) + 30;
                const resOrder = await db.run(`INSERT INTO orders (user_id, total, status, created_at) VALUES (?, ?, 'Concluído', ?)`, 
                    [userId, total, finalDate]);
                
                await db.run(`INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, 1, 1, ?)`, [resOrder.lastID, total]);
            }
        }

        res.json({ success: true, message: 'Sucesso! O banco foi populado com vendas reais dos últimos 7 dias. AGORA RECARREGUE O DASHBOARD E O GRÁFICO APARECERÁ!' });
    } catch (e) {
        console.error('Seed Error:', e);
        res.status(500).json({ error: e.message });
    }
};

exports.getOrders = async (req, res) => {
    try {
        const db = await getDb();
        const orders = await db.all('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar pedidos.' });
    }
};

// --- PRODUTOS E RECOMENDAÇÕES ---

exports.getProducts = async (req, res) => {
    try {
        const db = await getDb();
        const products = await db.all('SELECT * FROM products ORDER BY created_at DESC');
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar produtos.' });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const { name, description, price, image, category, status } = req.body;
        if (!name || !price) {
            return res.status(400).json({ error: 'Nome e preço são obrigatórios.' });
        }

        const db = await getDb();
        const result = await db.run(
            'INSERT INTO products (name, description, price, image, category, status) VALUES (?, ?, ?, ?, ?, ?)',
            [name, description || null, price, image || null, category || null, status || 'Disponível']
        );

        res.json({ message: 'Produto criado com sucesso!', id: result.lastID });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar produto.' });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, image, category, status } = req.body;

        const db = await getDb();
        await db.run(
            'UPDATE products SET name = ?, description = ?, price = ?, image = ?, category = ?, status = ? WHERE id = ?',
            [name, description || null, price, image || null, category || null, status || 'Disponível', id]
        );

        res.json({ message: 'Produto atualizado com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar produto.' });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const db = await getDb();
        await db.run('DELETE FROM products WHERE id = ?', [id]);
        res.json({ message: 'Produto removido com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao remover produto.' });
    }
};

exports.getRecommendations = async (req, res) => {
    try {
        const db = await getDb();

        // Retorna últimos itens comprados
        const lastPurchased = await db.all(`
            SELECT p.* 
            FROM products p
            JOIN order_items oi ON p.id = oi.product_id
            JOIN orders o ON oi.order_id = o.id
            WHERE o.user_id = ?
            GROUP BY p.id
            ORDER BY MAX(o.created_at) DESC
            LIMIT 3
        `, [req.user.id]);

        // Retorna mais comprados no geral do restaurante (se o usuário não tiver compras, isso serve)
        const mostPopular = await db.all(`
            SELECT p.*, SUM(oi.quantity) as total_sold
            FROM products p
            JOIN order_items oi ON p.id = oi.product_id
            GROUP BY p.id
            ORDER BY total_sold DESC
            LIMIT 3
        `);

        res.json({ lastPurchased, mostPopular });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao gerar recomendações.' });
    }
};

// Verifica Status de Login (para frontend)
exports.checkAuth = async (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.json({ isLoggedIn: false });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const db = await getDb();
        const user = await db.get('SELECT id, name, email, profile_picture, address, is_blocked FROM users WHERE id = ?', [decoded.id]);

        if (user) {
            if (user.is_blocked) {
                res.clearCookie('token');
                return res.json({ isLoggedIn: false, error: 'BLOCKED' });
            }
            // Atualiza last_active para mostrar online
            await db.run('UPDATE users SET last_active = NOW() WHERE id = ?', [decoded.id]);
            res.json({ isLoggedIn: true, user: user });
        } else {
            res.json({ isLoggedIn: false });
        }
    } catch (error) {
        res.json({ isLoggedIn: false });
    }
};

exports.updateProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
        }

        const userId = req.user.id;
        const profilePicturePath = `/uploads/${req.file.filename}`;

        const db = await getDb();
        await db.run('UPDATE users SET profile_picture = ? WHERE id = ?', [profilePicturePath, userId]);

        res.json({
            message: 'Foto de perfil atualizada com sucesso!',
            profile_picture: profilePicturePath
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar foto de perfil.' });
    }
};
