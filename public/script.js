// Initialize Stripe and Elements
const publishableKey = 'pk_test_51PdfJeCXxlVIqo4hm7ZyfaR4DOQpjvBKWonLDH4Uak5s0AcuMbk55p3wZjCaBOtdzaxJ9gBySx0m3ifVcQquDHIo00iXsWdZoG';
const stripe = Stripe(publishableKey); // Replace with your Stripe publishable key
const elements = stripe.elements();

async function initializePaymentElement() {
    let addressJSON = {}
    let paymentJSON = {}
    const { clientSecret } = await fetch('/create-payment-intent', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: 2000 }), // Amount in cents ($20.00)
    }).then(res => res.json());

    // Initialize elements with the client secret
    const stripeElements = stripe.elements({ clientSecret });

    // Create and mount the Payment Element
    const paymentElement = stripeElements.create('payment');
    paymentElement.mount('#payment-element');

    // Create and mount the Address Element with mode set to 'shipping' or 'billing'
    const addressElement = stripeElements.create('address', { mode: 'billing' });
    addressElement.mount('#address-element');

    // Create and mount the Payment Request Button
    const paymentRequest = stripe.paymentRequest({
        country: 'US',
        currency: 'usd',
        total: {
            label: 'Demo Payment',
            amount: 2000, // Amount in cents ($20.00)
        },
    });

    const prButton = stripeElements.create('paymentRequestButton', {
        paymentRequest,
    });

    paymentRequest.canMakePayment().then((result) => {
        if (result) {
            prButton.mount('#payment-request-button');
        } else {
            document.getElementById('payment-request-button').style.display = 'none';
        }
    });

    // Capture address element input values
    addressElement.on('change', (event) => {
        console.log('addressElement',addressElement._componentMode)
        if (event.complete) {
            addressJSON = event.value;
        } else if (event.error) {
            console.error('Address Element error:', event.error.message);
        }
        console.log('objectAddress',addressJSON)
    });
    // Capture payment element input values
    paymentElement.on('change', (event) => {
        if (event.complete) {
            paymentJSON = event.value;
        } else if (event.error) {
            console.error('Payment Element error:', event.error.message);
        }
    });
    // Handle form submission
    const form = document.getElementById('payment-form');
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Capture address element input values
        const addressElementData = addressElement.getValue();

        // Set cookie with address data & addressElement
        document.cookie = `addressData=${encodeURIComponent(JSON.stringify({
            ...addressJSON,
            componentMode: addressElement._componentMode
        }))}; path=/`;

        const { error } = await stripe.confirmPayment({
            elements: stripeElements,
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
