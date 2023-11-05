import { loadStripe } from '@stripe/stripe-js';
import { errorHandler } from './error';

// Initialize Stripe with your public key
const stripePromise = loadStripe('your-stripe-public-key');

export const initiatePayment = async (amountInPennies: number) => {
  try {
    // Await the Stripe object
    const stripe = await stripePromise;

    // Check if stripe is null or undefined
    if (!stripe) {
      throw new Error('Stripe initialization failed.');
    }

    // Redirect to Stripe Checkout
    const { error } = await stripe.redirectToCheckout({
      lineItems: [
        {
          price: 'your-price-id',
          quantity: 1,
        },
      ],
      mode: 'payment',
      successUrl: 'https://your-success-url',
      cancelUrl: 'https://your-cancel-url',
    });

    // Handle Stripe errors
    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    // Use your errorHandler to handle the error
    const { success, message, statusCode } = errorHandler({ error });
    console.error(`Stripe error: ${message}, Status Code: ${statusCode}, Success: ${success}`);
  }
};
