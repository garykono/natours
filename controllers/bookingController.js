// Stripe package returns a function, and we can pass in the secret key to that function to get an object we can use
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')
const factory = require('./handlerFactory')

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
    // 1) Get the currently booked tour
    const tour = await Tour.findById(req.params.tourId);

    // 2) Create checkout session
    const session = await stripe.checkout.sessions.create({
        // there should be other payment types too we can add later
        payment_method_types: ['card'],
        mode: 'payment',
        // success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
        success_url: `${req.protocol}://${req.get('host')}/my-tours?alert=booking`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email,
        client_reference_id: req.params.tourId,
        line_items: [
            {
                price_data: {
                    product_data: {
                        name: `${tour.name} Tour`,
                        description: tour.summary,
                        // Must be online images so stripe can download to their own server
                        images: [`${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`]
                    },
                    unit_amount: tour.price * 100,
                    currency: 'usd'
                },
                quantity: 1
            }
        ]
    })

    // 3) Create session as as response
    res.status(200).json({
        status: 'success',
        session
    });
});

// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//     // This is only temporary, because it's unsecure. Everyone can make bookings without paying, but we will use it for development.
//     // Switch to stripe webhooks on production
//     const { tour, user, price } = req.query;

//     if (!tour || !user || !price) return next();
    
//     await Booking.create({ tour, user, price });

//     res.redirect(req.originalUrl.split('?')[0]);
// });

const createBookingCheckout = async session => {
    const tour = session.client_reference_id;
    const user = (await User.findOne({ email: session.customer_email })).id;
    const price = session.amount_total / 100;
    await Booking.create({ tour, user, price });
}

exports.webhookCheckout = (req, res, next) => {
    const signature = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body, 
            signature, 
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        return res.status(400).send(`Webhook error: ${err.message}`);
    }

    if (event.type = 'checkout.session.completed') {
        createBookingCheckout(event.data.object);

        res.status(200).json({ received: true });
    }
}

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);