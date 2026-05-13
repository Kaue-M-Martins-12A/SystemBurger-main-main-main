const { getDb } = require('./src/config/database'); 
async function add() { 
    const db = await getDb(); 
    await db.run("INSERT INTO orders (user_id, total, status) VALUES (1, 150.00, 'Concluído')"); 
    await db.run("INSERT INTO orders (user_id, total, status, created_at) VALUES (1, 85.50, 'Concluído', datetime('now', '-2 days'))"); 
    console.log('Orders added'); 
} 
add();
