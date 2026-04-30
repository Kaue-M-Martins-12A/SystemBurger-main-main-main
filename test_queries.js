const mysql = require('mysql2/promise');
require('dotenv').config({ override: true });

async function test() {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306,
        });

        console.log("Connected to MySQL");
        const [tz] = await pool.query("SELECT @@global.time_zone, @@session.time_zone, NOW(), UTC_TIMESTAMP()");
        console.log("Timezones:", tz);

        const range = 'week';
        let dateLimit = "DATE_SUB(NOW(), INTERVAL 7 DAY)";
        const whereClause = `WHERE created_at >= ${dateLimit} AND status != 'Cancelado'`;
        
        console.log("whereClause:", whereClause);
        
        try {
            const [kpis] = await pool.query(`SELECT SUM(total) as t, COUNT(*) as c FROM orders ${whereClause}`);
            console.log("KPIs:", kpis);
        } catch (e) {
            console.error("KPI Error:", e.message);
        }
        
        try {
            const salesQuery = `
                SELECT DATE_FORMAT(created_at, '%d/%m') as label, SUM(total) as value 
                FROM orders 
                ${whereClause}
                GROUP BY label ORDER BY MIN(created_at) ASC
            `;
            const [sales] = await pool.query(salesQuery);
            console.log("Sales:", sales);
        } catch(e) {
            console.error("Sales Error:", e.message);
        }
        
        try {
            const whereClauseAliased = whereClause.replace(/created_at/g, 'o.created_at').replace(/status/g, 'o.status');
            const [niches] = await pool.query(`
                SELECT p.category, SUM(oi.quantity) as total_sold
                FROM order_items oi
                JOIN orders o ON oi.order_id = o.id
                JOIN products p ON oi.product_id = p.id
                ${whereClauseAliased}
                GROUP BY p.category
                ORDER BY total_sold DESC
            `);
            console.log("Niches:", niches);
        } catch(e) {
            console.error("Niches Error:", e.message);
        }

        try {
            const whereClauseAliased = whereClause.replace(/created_at/g, 'o.created_at').replace(/status/g, 'o.status');
            const [top] = await pool.query(`
                SELECT p.name, SUM(oi.quantity) as value
                FROM order_items oi
                JOIN orders o ON oi.order_id = o.id
                JOIN products p ON oi.product_id = p.id
                ${whereClauseAliased}
                GROUP BY p.id, p.name
                ORDER BY value DESC
                LIMIT 5
            `);
            console.log("Top Products:", top);
        } catch(e) {
            console.error("Top Error:", e.message);
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
test();
