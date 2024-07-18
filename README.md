## Payment Element
- The Payment Element allows you to collect payment details in a single, unified UI component. It supports multiple payment methods and dynamically adjusts to display only the methods you’ve configured in the Stripe Dashboard.
## Address Element
- The Address Element can be used to collect address information from your customers, with built-in validation and formatting tailored to the customer’s region.
## Express Payment
- Express Payment options like Apple Pay and Google Pay can be integrated to provide a faster checkout experience. These options leverage the Payment Request Button, a part of Stripe Elements, which offers a streamlined payment process.

## Credentials Needed for Client-Side Integration
To integrate Stripe Elements on the client-side, you need the following credentials:

- Publishable API Key: This key is used on the client side to initialize Stripe.js and create instances of Stripe Elements. It can be found in your Stripe Dashboard under the API keys section.
- Secret API Key (server-side): While not directly used in the client-side integration, used to create PaymentIntents or SetupIntents, this way we can quickly test calls and what data is available to the application.

##  Capturing Data in the Forms

### 1 Initialize Stripe and Elements
```
 // Load Stripe.js
 const stripe = Stripe('your-publishable-key');

 // Create an instance of Elements from Stripe
 const elements = stripe.elements();

 // Create a payment-intent 
 const { clientSecret } = await fetch('/create-payment-intent', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: 2000 }), // Amount in cents ($20.00)
    }).then(res => res.json());

 // Initialize elements with the client secret
 const stripeElements = stripe.elements({ clientSecret });
```

### 2 Create and Mount the Elements

```
// Create an instance of the Payment Element
 const paymentElement = elements.create('payment');

 // Mount the Payment Element to a DOM element
 paymentElement.mount('#payment-element');

 // Create and mount the Address Element with mode set to 'shipping' or 'billing'
 const addressElement = stripeElements.create('address', { mode: 'billing' });
 addressElement.mount('#address-element');
```

### Handle Form Submission & Cookie setup

```
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
```

## Server-Side Handling

```
onst express = require('express');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const path = require('path');
const stripe = require('stripe');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const secretKey = process.env.NODE_APP_STRIPE_SECRET_KEY;
const publishableKey = process.env.NODE_APP_STRIPE_PUBLISHABLE_KEY;

const stripeInstance = stripe(secretKey);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.get('/success', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'success.html'));
});

app.post('/create-payment-intent', async (req, res) => {
    const { amount } = req.body;

    try {
        const paymentIntent = await stripeInstance.paymentIntents.create({
            amount,
            currency: 'usd',
            payment_method_types: ['card'],
        });
        res.send({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});

app.listen(port, () => console.log(`Server running on port ${port}`));

```
