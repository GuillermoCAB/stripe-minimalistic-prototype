const express = require('express');
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
