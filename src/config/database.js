const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

let dbPromise = null;

async function getDb() {
    if (!dbPromise) {
        dbPromise = open({
            filename: path.join(__dirname, '../../burger.db'),
            driver: sqlite3.Database
        }).then(async (db) => {
            console.log("SQLite connection created successfully.");
            
            // Execute the schema file to ensure tables exist
            const schemaPath = path.join(__dirname, '../../schema.sql');
            try {
                const schema = fs.readFileSync(schemaPath, 'utf8');
                // Split by semicolon and run each statement to prevent sqlite issues
                const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);
                for (const stmt of statements) {
                    await db.exec(stmt);
                }
            } catch (err) {
                console.error("Error executing schema.sql:", err);
            }
            
            return db;
        });
    }
    return dbPromise;
}

module.exports = { getDb };
