const moment = require('moment');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { sendResponse } = require('../utils/responseHandler');
const { isValidMalaysianPhoneNumber, formatMalaysianPhoneNumber, isValidEmail } = require('../utils/validation');
const { insertOrUpdateCustomer } = require('../models/customerModel');
const { insertTrip, getTripDetails, submitReview, getTripsWithReviews, getCustomerTripsAndReviews } = require('../models/tripModel');
 



async function planHoliday(req, res) {

    console.log('Received request body:', req.body);

    const { customerName, phoneNumber, email, dateTravelling, country, languageSpoken, numberOfTravelers } = req.body;
 
    try {

        // Validation

        if (!customerName || !phoneNumber || !email || !dateTravelling || !country || !languageSpoken || !numberOfTravelers) {

            throw new Error('All fields are required');

        }
 
        if (!isValidEmail(email)) {

            throw new Error('Invalid email format');

        }
 
        if (!isValidMalaysianPhoneNumber(phoneNumber)) {

            throw new Error('Invalid phone number format');

        }
 
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
 

        // For submitted language
        const submittedLanguages = languageSpoken.toLowerCase().split(',').map(lang => lang.trim());
 

        // Check if customer speaks that language
        const knowsLanguage = submittedLanguages.some(data => countryLanguages.includes(data));
 
        console.log('Language check:', { countryLanguages, submittedLanguages, knowsLanguage });
 


        // Phone Number Format
        const formattedPhoneNumber = formatMalaysianPhoneNumber(phoneNumber);
 


        // Database operations
        const customerId = await insertOrUpdateCustomer(customerName, email, formattedPhoneNumber);
 
        const tripId = await insertTrip(customerId, formattedDate.toDate(), country, languageSpoken, numberOfTravelers, knowsLanguage);
 
        console.log('Trip planned successfully for customer:', customerId);

        sendResponse(res, 201, 'Trip planned successfully', {

            customerId,

            tripId,

            languageSuitability: knowsLanguage ? 'Suitable' : 'May face language barrier',

            countryLanguages,

            submittedLanguages

        });
 
    } catch (error) {

        console.error('Error in holiday planner:', error);

        sendResponse(res, 400, error.message || 'An error occurred during submission');

    }

}
 
async function submitTripReview(req, res) {

    const { tripId, rating } = req.body;
 
    try {

        if (!tripId || !rating || !Number.isInteger(rating) || rating < 1 || rating > 5) {

            throw new Error('Invalid review data. TripId and rating (integer 1-5) are required.');

        }
 
        const trip = await getTripDetails(tripId);
 
        if (!trip) {

            throw new Error('Trip not found');

        }
 
        const travelDate = moment(trip.DateTravelling);

        const currentDate = moment();
 
        if (travelDate.isAfter(currentDate)) {

            throw new Error('Cannot submit a review for a future trip.');

        }
 
        await submitReview(tripId, rating);
 
        sendResponse(res, 201, 'Review submitted successfully');

    } catch (error) {

        console.error('Error in submit review:', error);

        sendResponse(res, 400, error.message || 'An error occurred while submitting the review');

    }

}
 
async function getCustomerTrips(req, res) {

    const customerId = req.query.customerId || req.params.customerId;
    console.log('Fetching trips for customer:', customerId);
 
    try {

        const trips = await getTripsWithReviews(customerId);
        console.log('Trips fetched:', trips.length);

        if (trips.length === 0) {
            console.log('No trips found for customer');
            return sendResponse(res, 404, 'No trips found for this customer', { trips: [] });
        }

        console.log('Sending successful response');
        sendResponse(res, 200, 'Trips retrieved successfully', { trips });

    } catch (error) {

        console.error('Error in get customer trips:', error);
        sendResponse(res, 400, error.message || 'An error occurred while retrieving trips');

    }

}
 
async function viewCustomerData(req, res) {
    const { customerId } = req.params;
 
    try {
        const tripsAndReviews = await getCustomerTripsAndReviews(customerId);
 
        if (tripsAndReviews.length === 0) {
            return sendResponse(res, 404, 'No trips found for this customer');
        }
 
        sendResponse(res, 200, 'Customer data retrieved successfully', { tripsAndReviews });
    } catch (error) {
        console.error('Error in viewCustomerData:', error);
        sendResponse(res, 500, 'An error occurred while retrieving customer data');
    }
}
 

module.exports = { planHoliday, submitTripReview, getCustomerTrips, viewCustomerData};
 