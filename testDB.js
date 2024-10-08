const sql = require('mssql/msnodesqlv8');

const config = {
    driver: 'msnodesqlv8',
    server: 'LAPTOP-VO0GVDHR\\SQLEXPRESS',
    database: 'TravelPlanner',
    options: {
        trustedConnection: true,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

async function testConnection() {
    try {
        await sql.connect(config);
        console.log("Connected successfully!");
        
        const result = await sql.query`SELECT TOP 1 * FROM INFORMATION_SCHEMA.TABLES`;
        console.log(result);
    } catch (err) {
        console.error("Connection failed:", err);
    } finally {
        await sql.close();
    }
}

testConnection();