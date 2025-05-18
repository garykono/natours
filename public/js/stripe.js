import axios from 'axios';
import { showAlert } from './alerts';

export const bookTour = async tourId => {
    try {
        const stripe = Stripe('pk_test_51RPmIjC6x0dZOIWyqXmrDNRkkShsFqAw3UHyslA6BLu9McoQnU5OHGq1uG63krBxqWNf816QYK8DwnaXRsFw1Xzm00TYKL2wtB')
        // 1) Get checkout session from API
        const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);

        // 2) Create checkout form + charge credit card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        });
    } catch (err) {
        console.log(err);
        showAlert('error', err);
    }
}