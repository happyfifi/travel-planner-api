// const sql = require('mssql/msnodesqlv8');

// const config = {
//     driver: 'msnodesqlv8',
//     server: 'LAPTOP-VO0GVDHR\\SQLEXPRESS',
//     database: 'TravelPlanner',
//     options: {
//         trustedConnection: true,
//         trustServerCertificate: true,
//         enableArithAbort: true
//     }
// };

// async function connectToDatabase() {
//     try {
//         await sql.connect(config);
//         console.log('Connected to database');
//     } catch (err) {
//         console.error('Database connection failed:', err);
//         throw err;
//     }
// }

// module.exports = { sql, connectToDatabase };



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
 
async function connectToDatabase() {
    try {
        await sql.connect(config);
        console.log('Connected to database');
    } catch (err) {
        console.error('Database connection failed:', err);
        throw err;
    }
}
 
module.exports = { sql, connectToDatabase };