const express = require('express');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const path = require('path');
const stripe = require('stripe');
const session = require('express-session');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const secretKey = process.env.NODE_APP_STRIPE_SECRET_KEY;
const publishableKey = process.env.NODE_APP_STRIPE_PUBLISHABLE_KEY;

const stripeInstance = stripe(secretKey);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: secretKey,
    resave: false,
    saveUninitialized: true,
}));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/store-address-data', (req, res) => {
    req.session.formData = {
        ...req.session.formData,
        addressElementData: req.body.addressElementData,
    };
    res.sendStatus(200);
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

app.post('/store-address-data', (req, res) => {
    req.session.formData = {
        ...req.session.formData,
        addressElementData: req.body.addressElementData,
    };
    res.sendStatus(200);
});

app.listen(port, () => console.log(`Server running on port ${port}`));
