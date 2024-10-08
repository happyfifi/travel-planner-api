const express = require('express');
const sql = require('mssql/msnodesqlv8');
const moment = require('moment');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));



const app = express();
app.use(express.json());


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


//Connect to database
sql.connect(config).then(() => {
  console.log('Connected to database');
}).catch(err => {
  console.error('Database connection failed:', err);
});



const port = 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});




// Validation functions (Phone Number)

function isValidMalaysianPhoneNumber(phoneNumber) {
    const patterns = [
        /^(0[3-9]|60[3-9]|\+60[3-9])(\d{7,8})$/,
        /^(08[0-9]|608[0-9]|\+608[0-9])(\d{6})$/,
        /^(01[0-9]|601[0-9]|\+601[0-9])(\d{7})$/,
        /^(011|6011|\+6011)(\d{8})$/
    ];
    return patterns.some(pattern => pattern.test(phoneNumber));
}

function formatMalaysianPhoneNumber(phoneNumber) {
    const patterns = [
        { regex: /^(0[3-9]|60[3-9]|\+60[3-9])(\d{7,8})$/, format: '$1-$2' },
        { regex: /^(08[0-9]|608[0-9]|\+608[0-9])(\d{6})$/, format: '$1-$2' },
        { regex: /^(01[0-9]|601[0-9]|\+601[0-9])(\d{7})$/, format: '$1-$2' },
        { regex: /^(011|6011|\+6011)(\d{8})$/, format: '$1-$2' }
    ];
    for (let pattern of patterns) {
        if (pattern.regex.test(phoneNumber)) {
            return phoneNumber.replace(pattern.regex, pattern.format);
        }
    }
    return phoneNumber;
}

// Validation Email

const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};


// Function for sending response
function sendResponse(res, statusCode, message, data = {}) {
    res.status(statusCode).json({
        status: statusCode === 201 ? 'success' : 'error',
        message,
        ...data
    });
}

//Holiday end-point
app.post('/holiday-planner', async (req, res) => {
    console.log('Received request body:', req.body);
    const { customerName, phoneNumber, email, dateTravelling, country, languageSpoken, numberOfTravelers } = req.body;
 
    console.log('Extracted fields:', { customerName, phoneNumber, email, dateTravelling, country, languageSpoken, numberOfTravelers});
    try {
        // Validation
        if (!customerName || !phoneNumber || !email || !dateTravelling || !country || !languageSpoken || !numberOfTravelers) {
            console.log('Missing fields:', { customerName, phoneNumber, email, dateTravelling, country, languageSpoken, numberOfTravelers });
            throw new Error('All fields are required');
        }
 
        // Validate email format
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            throw new Error('Invalid email format');
        }
 
        // Validate phone number (adjust regex as needed for Malaysian numbers)
        if (!isValidMalaysianPhoneNumber(phoneNumber)) {
            throw new Error('Invalid phone number format');
        }
 
        // Validate date format
        const formattedDate = moment(dateTravelling, 'DD/MM/YYYY', true);
        if (!formattedDate.isValid()) {
            throw new Error('Invalid date format. Use DD/MM/YYYY');
        }
        
        // Fetch country data from external API
        const response = await fetch(`https://restcountries.com/v3.1/name/${country}`);
        const countryData = await response.json();

        if (!countryData || countryData.length === 0) {
            throw new Error('Invalid country name');
        }

        // Extract languages from country data
        const countryLanguages = Object.values(countryData[0].languages).map(lang => lang.toLowerCase());

        //For submitted language
        const submittedLanguages = languageSpoken.toLowerCase().split(',').map(lang => lang.trim());

        // CheckIfCustomerSpeakThatLanguage
        const knowsLanguage = submittedLanguages.some(data => countryLanguages.includes(data));

        console.log('Language check:', { countryLanguages, submittedLanguages, knowsLanguage });

        //Phone Number Format
        const formattedPhoneNumber = formatMalaysianPhoneNumber(phoneNumber);

        // Database operations
        const pool = await sql.connect(config);
 
        // Insert or update customer details
        const customerResult = await pool.request()
            .input('name', sql.NVarChar, customerName)
            .input('email', sql.NVarChar, email)
            .input('phone', sql.NVarChar, phoneNumber, formattedPhoneNumber)
            .query(`
                MERGE INTO CustomerDetails AS target
                USING (SELECT @name AS Name, @email AS Email, @phone AS PhoneNumber) AS source
                ON target.Email = source.Email
                WHEN MATCHED THEN
                    UPDATE SET Name = source.Name, PhoneNumber = source.PhoneNumber
                WHEN NOT MATCHED THEN
                    INSERT (Name, Email, PhoneNumber)
                    VALUES (source.Name, source.Email, source.PhoneNumber);
                SELECT CustomerID FROM CustomerDetails WHERE Email = @email;
            `);
 
        const customerId = customerResult.recordset[0].CustomerID;
 
        // Insert trip details
        await pool.request()
            .input('customerId', sql.Int, customerId)
            .input('dateTravelling', sql.Date, formattedDate.toDate())
            .input('country', sql.NVarChar, country)
            .input('languageSpoken', sql.NVarChar, languageSpoken)
            .input('numberOfTravelers', sql.Int, numberOfTravelers)
            .input('knowsLanguage', sql.Bit, knowsLanguage) // You might want to implement language check logic
            .query(`
                INSERT INTO TripDetails (CustomerID, DateTravelling, Country, LanguageSpoken, NumberOfTravelers, KnowsLanguage, IsCompleted)
                VALUES (@customerId, @dateTravelling, @country, @languageSpoken, @numberOfTravelers, @knowsLanguage, 0)
            `);




        console.log('Trip planned successfully for customer:', customerId);
        sendResponse(res, 201, 'Trip planned successfully', {
            customerId,
            languageSuitability: knowsLanguage ? 'Suitable' : 'May face language barrier',
            countryLanguages,
            submittedLanguages
        });

     } catch (error) {
        console.error('Error in holiday planner:', error);
        sendResponse(res, 400, error.message || 'An error occurred during submission');
    
     }

    });

//         res.status(201).json({ 
//             message: 'Trip planned successfully', 
//             customerId,
//             languageSuitability: knowsLanguage ? 'Suitable' : 'May face language barrier',
//             countryLanguages,
//             submittedLanguages
//          });

//     } catch (error) {
//         console.error('Error in holiday planner:', error);
//         res.status(400).json({ error: error.message || 'An error occurred during submission' });
//     }
// });














// // Holiday Planner endpoint
// app.post('/holiday-planner', async (req, res) => {
//     const { customerName, phoneNumber, email, dateTravelling, country, languageSpoken, numberOfTravellers } = req.body;

//     try {
//         // Validation
//         if (!customerName || !phoneNumber || !email || !dateTravelling || !country || !languageSpoken || !numberOfTravellers) {
//             throw new Error('All fields are required');
//         }

//         if (!isValidMalaysianPhoneNumber(phoneNumber)) {
//             throw new Error('Invalid phone number format');
//         }

//         const formattedPhoneNumber = formatMalaysianPhoneNumber(phoneNumber);


//         if (!isValidEmail(email)) {
//             throw new Error('Invalid email format');
//         }



//         const formattedDate = moment(dateTravelling, ['DD/MM/YYYY', 'DD/MM/YY HH'], true);
//         if (!formattedDate.isValid()) {
//             throw new Error('Invalid date format. Use DD/MM/YYYY or DD/MM/YY HH');
//         }


//        // Fetch country data from external API
//         const response = await fetch(`https://restcountries.com/v3.1/name/${country}`);
//         const countryData = await response.json();

//         if (!countryData || countryData.length === 0) {
//             throw new Error('Invalid country name');
//         }

//         // Extract languages from country data
//         const countryLanguages = Object.values(countryData[0].languages);

//         // CheckIfCustomerSpeakThatLanguage
//         const knowsLanguage = countryLanguages.some(lang => languageSpoken.includes(lang));

//         // Database operations
//         const pool = await sql.connect(config);

//         // Insert or get customer
//         let customerId;
//         const customerResult = await pool.request()
//             .input('name', sql.NVarChar, customerName)
//             .input('phone', sql.NVarChar, phoneNumber)
//             .input('email', sql.NVarChar, email)
//             .query('INSERT INTO CustomerDetails (CustomerName, PhoneNumber, Email) OUTPUT INSERTED.CustomerID VALUES (@name, @phone, @email)');
//         customerId = customerResult.recordset[0].CustomerID;

//         // Insert trip details
//         await pool.request()
//             .input('customerId', sql.Int, customerId)
//             .input('date', sql.DateTime, formattedDate.toDate())
//             .input('country', sql.NVarChar, country)
//             .input('language', sql.NVarChar, languageSpoken)
//             .input('travelers', sql.Int, numberOfTravellers)
//             .input('knowsLanguage', sql.Bit, knowsLanguage)
//             .query('INSERT INTO TripDetails (CustomerID, DateTravelling, Country, LanguageSpoken, NumberOfTraveLlers, KnowsLanguage) VALUES (@customerId, @date, @country, @language, @travelers, @knowsLanguage)');

//         res.status(201).json({ message: 'Trip planned successfully', knowsLanguage });
//     } catch (error) {
//         console.error(error);
//         res.status(400).json({ error: error.message || 'An error occurred during submission' });
//     }
// });


// // View Data endpoint
// app.get('/view-trips/:customerId', async (req, res) => {
//     const { customerId } = req.params;

//     try {
//         const pool = await sql.connect(config);
//         const result = await pool.request()
//             .input('customerId', sql.Int, customerId)
//             .query(`
//                 SELECT 
//                     c.CustomerName, c.PhoneNumber, c.Email,
//                     t.TripID, t.DateTravelling, t.Country, t.LanguageSpoken, t.NumberOfTravelLers, t.KnowsLanguage,
//                     r.Rating, r.Comment
//                 FROM CustomerDetails c
//                 JOIN TripDetails t ON c.CustomerID = t.CustomerID
//                 LEFT JOIN Reviews r ON t.TripID = r.TripID
//                 WHERE c.CustomerID = @customerId
//             `);

//         if (result.recordset.length === 0) {
//             return res.status(404).json({ error: 'No trips found for this customer' });
//         }

//         res.json(result.recordset);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'An error occurred while retrieving trip data' });
//     }
// });


// // Submit Review endpoint
// app.post('/submit-review', async (req, res) => {
//     const { tripId, rating, comment } = req.body;

//     try {
//         if (!tripId || !rating) {
//             throw new Error('TripID and Rating are required');
//         }

//         if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
//             throw new Error('Rating must be an integer between 1 and 5');
//         }

//         const pool = await sql.connect(config);

//         // Check if the trip exists and is completed
//         const tripResult = await pool.request()
//             .input('tripId', sql.Int, tripId)
//             .query('SELECT DateTravelling, IsCompleted FROM TripDetails WHERE TripID = @tripId');

//         if (tripResult.recordset.length === 0) {
//             throw new Error('Trip not found');
//         }

//         const trip = tripResult.recordset[0];
//         const currentDate = new Date();

//         if (new Date(trip.DateTravelling) > currentDate) {
//             throw new Error('Cannot submit a review for a future trip');
//         }

//         if (!trip.IsCompleted) {
//             // Mark the trip as completed if it's past the travel date
//             await pool.request()
//                 .input('tripId', sql.Int, tripId)
//                 .query('UPDATE TripDetails SET IsCompleted = 1 WHERE TripID = @tripId');
//         }

//         // Check if a review already exists
//         const existingReview = await pool.request()
//             .input('tripId', sql.Int, tripId)
//             .query('SELECT ReviewID FROM Reviews WHERE TripID = @tripId');

//         if (existingReview.recordset.length > 0) {
//             throw new Error('A review for this trip already exists');
//         }

//         // Insert review
//         await pool.request()
//             .input('tripId', sql.Int, tripId)
//             .input('rating', sql.Int, rating)
//             .input('comment', sql.NVarChar, comment)
//             .query('INSERT INTO Reviews (TripID, Rating, Comment) VALUES (@tripId, @rating, @comment)');

//         res.status(201).json({ message: 'Review submitted successfully' });
//     } catch (error) {
//         console.error(error);
//         res.status(400).json({ error: error.message || 'An error occurred while submitting the review' });
//     }
// });























































// let holidayPlans = [];

// // Middleware to parse JSON bodies
// app.use(express.json());

// app.get('/', (req, res) => {
//   res.send('Welcome to the Travel Planner API');
// });


// app.post('/holiday-planner', async (req, res) => {
//   try {
//     const { customerID, dateTime, country, languageSpoken, numberOfTravellers } = req.body;

//       //Validate Input
//       if (!customerID || !datetime || !country || !languageSpoken || !numberofTravelLers)
//         return res.status(400).json({ error: 'All fields are required'});
//     }

//       //Format date using Moment.js
//       const formattedDate = moment(dateTime).format('DD/MM/YY');

//       //Fetch country data from external API
//       const response = await fetch(`https://restcountries.com/v3.1/name/${country}`);
//       const countryData = await response.json();

//       if (!countryData || countryData.length === 0) {
//         return res.status(400).json({ error: 'Invalid country name'});
//       }
      
//       const countryLanguages = Object.values(countryData[0].languages);

//       //Check if the customer knows the country's language
//       const knowsLanguage = countryLanguages.includes(languageSpoken);

//       const newPlan = {
//         id: holidayPlans.length + 1,
//         customerId,
//         dateTime: formattedDate,
//         country,
//         languageSpoken,
//         numberOfTravellers,
//         knowsLanguage
//       };
  
//       holidayPlans.push(newPlan);
  
//       res.status(201).json(newPlan);
//     } catch (error) {
//       console.error('Error in holiday planner:', error);
//       res.status(500).json({ error: 'Internal server error' });
//     }

//Implementing Holiday Planner API
// app.post('/holiday-planner', async (req, res) => {
//   try {
//     const { customerId, dateTime, country, languageSpoken, numberOfTravellers } = req.body;
    
//     // Validate input
//     if (!customerId || !dateTime || !country || !languageSpoken || !numberOfTravellers) {
//       return res.status(400).json({ error: 'All fields are required' });
//     }

//     // Format date using Moment.js
//     const formattedDate = moment(dateTime).format('DD/MM/YY');

//     // Fetch country data from external API
//     const response = await fetch(`https://restcountries.com/v3.1/name/${country}`);
//     const countryData = await response.json();

//     if (!countryData || countryData.length === 0) {
//       return res.status(400).json({ error: 'Invalid country name' });
//     }

//     const countryLanguages = Object.values(countryData[0].languages);

//     // Check if the customer knows the country's language
//     const knowsLanguage = countryLanguages.includes(languageSpoken);

//     const newPlan = {
//       id: holidayPlans.length + 1,
//       customerId,
//       dateTime: formattedDate,
//       country,
//       languageSpoken,
//       numberOfTravellers,
//       knowsLanguage
//     };

//     holidayPlans.push(newPlan);

//     res.status(201).json(newPlan);
//   } catch (error) {
//     console.error('Error in holiday planner:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// // Implementing View Previous Plans
// app.get('/view-plans/:customerId', (req, res) => {
//   const customerId = req.params.customerId;
  
//   // Filter plans for the specific customer
//   const customerPlans = holidayPlans.filter(plan => plan.customerId === customerId);
  
//   if (customerPlans.length === 0) {
//     return res.status(404).json({ error: 'No plans found for this customer' });
//   }

//   res.json(customerPlans);
// });

// app.listen(port, () => {
//   console.log(`Server running at http://localhost:${port}`);
// });