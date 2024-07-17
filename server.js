const express = require('express');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const path = require('path');
const stripe = require('stripe')

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const secretKey = process.env.NODE_APP_STRIPE_SECRET_KEY;
const publishableKey = process.env.NODE_APP_STRIPE_PUBLISHABLE_KEY

const stripeInstance = stripe(secretKey)
console.log(secretKey);
console.log(publishableKey);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('public'));

// Route to serve the index.html with the publishable key injected
app.get('/', (req, res) => {
    res.render('index', { publishableKey });
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

app.listen(3000, () => console.log('Server running on port 3000'));
