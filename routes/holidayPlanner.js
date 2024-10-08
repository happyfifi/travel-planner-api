const express = require('express');
const router = express.Router();
const { planHoliday, submitTripReview, getCustomerTrips, viewCustomerData } = require('../controllers/holidayPlannerController');

router.post('/', planHoliday);
router.post('/review', submitTripReview);
router.get('/trips', getCustomerTrips);



router.get('/customer/:customerID', viewCustomerData);



module.exports = router;