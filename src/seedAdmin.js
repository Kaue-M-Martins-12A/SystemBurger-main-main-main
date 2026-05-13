const { getDb } = require('./config/database');

async function seedAdmin() {
    try {
        const db = await getDb();
        
        // Verifica se o usuário já existe
        const user = await db.get('SELECT id FROM users WHERE email = ?', ['ADM2026@gmail.com']);
        
        if (!user) {
            // Insere o admin se não existir
            await db.run(
                'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
                ['Administrador', 'ADM2026@gmail.com', '$2b$10$nWA2paQwp3hO1dCyOiZZD.DSbNWm4vF/ob0XgaDS/aLd9NWLg73ga']
            );
            console.log('Administrador criado com sucesso!');
        } else {
            console.log('O administrador já existe no banco de dados.');
        }
    } catch (err) {
        console.error('Erro ao adicionar administrador:', err);
    }
    process.exit(0);
}

seedAdmin();
