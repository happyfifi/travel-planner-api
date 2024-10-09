const express = require('express');
const { connectToDatabase } = require('./config/database');
const holidayPlannerRoutes = require('./routes/holidayPlanner');


const app = express();
app.use(express.json());



//Connect to database
connectToDatabase();


//Routes
app.use('/holiday-planner', holidayPlannerRoutes);


const port = 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});































































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
