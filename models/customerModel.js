
const { sql } = require('../config/database');
 
async function insertOrUpdateCustomer(customerName, email, phoneNumber) {
    try {
        const request = new sql.Request();
        request.input('name', sql.NVarChar, customerName);
        request.input('email', sql.NVarChar, email);
        request.input('phone', sql.NVarChar, phoneNumber);
 
        const result = await request.query(`
            MERGE INTO CustomerDetails AS target
            USING (VALUES (@name, @email, @phone)) AS source (Name, Email, PhoneNumber)
            ON target.Email = source.Email
            WHEN MATCHED THEN
                UPDATE SET Name = source.Name, PhoneNumber = source.PhoneNumber
            WHEN NOT MATCHED THEN
                INSERT (Name, Email, PhoneNumber)
                VALUES (source.Name, source.Email, source.PhoneNumber);
            SELECT CustomerID FROM CustomerDetails WHERE Email = @email;
        `);
 
        if (result.recordset.length > 0) {
            return result.recordset[0].CustomerID;
        } else {
            throw new Error('Failed to insert or retrieve customer');
        }
    } catch (error) {
        console.error('Error in insertOrUpdateCustomer:', error);
        throw error;
    }
}
 
module.exports = { insertOrUpdateCustomer };