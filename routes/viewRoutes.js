const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

router.use(viewsController.alerts);

router.use(authController.isLoggedIn);

// Development code
// router.get('/', 
//     // Booking is here because this is the page the user is redirected to after booking a tour
//     bookingController.createBookingCheckout, 
//     authController.isLoggedIn, 
//     viewsController.getOverview
// );
router.get( '/', authController.isLoggedIn, viewsController.getOverview);

router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour);
router.get('/login', authController.isLoggedIn, viewsController.getLoginForm)
router.get('/me', authController.protect, viewsController.getAccount)
router.get('/my-tours', authController.protect, viewsController.getMyTours)

router.post('/submit-user-data', authController.protect, viewsController.updateUserData)

module.exports = router;