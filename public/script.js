// Initialize Stripe and Elements
const publishableKey = 'pk_test_51PdfJeCXxlVIqo4hm7ZyfaR4DOQpjvBKWonLDH4Uak5s0AcuMbk55p3wZjCaBOtdzaxJ9gBySx0m3ifVcQquDHIo00iXsWdZoG'
const stripe = Stripe(publishableKey); // Replace with your Stripe publishable key
const elements = stripe.elements();

// Fetch the client secret from the server
async function initializePaymentElement() {
    const { clientSecret } = await fetch('/create-payment-intent', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: 2000 }), // Amount in cents ($20.00)
    }).then(res => res.json());

    // Initialize elements with the client secret
    const elements = stripe.elements({ clientSecret });

    console.log("Stripe initialized:", stripe);
    console.log("Elements initialized:", elements);

    // Create and mount the Payment Element
    const paymentElement = elements.create('payment');
    paymentElement.mount('#payment-element');
    console.log("Payment Element mounted");

    // Create and mount the Address Element with mode set to 'shipping' or 'billing'
    const addressElement = elements.create('address', { mode: 'shipping' }); // or { mode: 'billing' }
    addressElement.mount('#address-element');
    console.log("Address Element mounted");

    // Create and mount the Payment Request Button
    const paymentRequest = stripe.paymentRequest({
        country: 'US',
        currency: 'usd',
        total: {
            label: 'Demo Payment',
            amount: 2000, // Amount in cents ($20.00)
        },
    });

    const prButton = elements.create('paymentRequestButton', {
        paymentRequest,
    });

    paymentRequest.canMakePayment().then((result) => {
        if (result) {
            prButton.mount('#payment-request-button');
            console.log("Payment Request Button mounted");
        } else {
            document.getElementById('payment-request-button').style.display = 'none';
            console.log("Payment Request Button not available");
        }
    });

    // Handle form submission
    const form = document.getElementById('payment-form');
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: 'http://localhost:3000/success',
            },
        });

        if (error) {
            document.getElementById('payment-status').innerText = error.message;
        } else {
            document.getElementById('payment-status').innerText = 'Payment successful!';
        }
    });
}

// Initialize the payment element on page load
initializePaymentElement();