

const { sql } = require('../config/database');
 
async function insertTrip(customerId, dateTravelling, country, languageSpoken, numberOfTravelers, knowsLanguage) {

    const result = await sql.query`

        INSERT INTO TripDetails (CustomerID, DateTravelling, Country, LanguageSpoken, NumberOfTravelers, KnowsLanguage, IsCompleted)

        OUTPUT INSERTED.TripID

        VALUES (${customerId}, ${dateTravelling}, ${country}, ${languageSpoken}, ${numberOfTravelers}, ${knowsLanguage}, 0)

    `;

    return result.recordset[0].TripID;

}
 
async function getTripDetails(tripId) {

    const result = await sql.query`

        SELECT * FROM TripDetails WHERE TripID = ${tripId}

    `;

    return result.recordset[0];

}
 
async function submitReview(tripId, rating) {

    const currentDate = new Date();

    await sql.query`

        UPDATE TripDetails 

        SET Rating = ${rating}, ReviewDate = ${currentDate}, IsCompleted = 1

        WHERE TripID = ${tripId}

    `;

}
 
async function getTripsWithReviews(customerId) {

    const result = await sql.query`

        SELECT * FROM TripDetails

        WHERE CustomerID = ${customerId}

        ORDER BY 

            CASE 

                WHEN ReviewDate IS NOT NULL THEN ReviewDate

                ELSE DateTravelling

            END DESC,

            DATEDIFF(SECOND, '2000-01-01', 

                CASE 

                    WHEN ReviewDate IS NOT NULL THEN ReviewDate

                    ELSE DateTravelling

                END

            ) DESC

    `;

    return result.recordset;

}

async function getCustomerTripsAndReviews(customerId) {
    try {
        const result = await sql.query`
            SELECT 
                t.TripID,
                t.CustomerID,
                t.DateTravelling,
                t.Country,
                t.LanguageSpoken,
                t.NumberOfTravelers,
                t.KnowsLanguage,
                t.IsCompleted,
                t.Rating,
                t.ReviewDate
            FROM 
                TripDetails t
            WHERE 
                t.CustomerID = ${customerId}
            ORDER BY 
                t.DateTravelling DESC
        `;
        return result.recordset;
    } catch (error) {
        console.error('Error in getCustomerTripsAndReviews:', error);
        throw error;
    }
}
 
 
module.exports = { insertTrip, getTripDetails, submitReview, getTripsWithReviews, getCustomerTripsAndReviews };
 