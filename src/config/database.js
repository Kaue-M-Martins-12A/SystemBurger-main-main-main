const mysql = require('mysql2/promise');
require('dotenv').config({ override: true });

let pool;

async function getDb() {
    if (!pool) {
        pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'alunos',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'burger_db',
            port: process.env.DB_PORT || 3306,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        // Add wrapper methods to simulate sqlite package API
        pool.get = async function(sql, params = []) {
            const [rows] = await this.query(sql, params);
            return rows[0];
        };
        
        pool.all = async function(sql, params = []) {
            const [rows] = await this.query(sql, params);
            return rows;
        };
        
        pool.run = async function(sql, params = []) {
            const [result] = await this.execute(sql, params);
            return { lastID: result.insertId, changes: result.affectedRows };
        };
        
        pool.exec = async function(sql) {
            await this.query(sql);
        };
        
        console.log("MySQL connection pool created successfully.");
    }
    return pool;
}

module.exports = { getDb };
