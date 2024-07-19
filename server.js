const express = require("express");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const path = require("path");
const stripe = require("stripe");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const secretKey = process.env.NODE_APP_STRIPE_SECRET_KEY;

const stripeInstance = stripe(secretKey);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/success", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "success.html"));
});

app.post("/create-payment-intent", async (req, res) => {
  const { amount } = req.body;

  try {
    const paymentIntent = await stripeInstance.paymentIntents.create({
      amount,
      currency: "usd",
      payment_method_types: ["card"],
      metadata: {
        // Add any metadata here if needed
      },
    });

    const creationTimestamp = new Date().toISOString();

    res.send({
      clientSecret: paymentIntent.client_secret,
      creationTimestamp: creationTimestamp,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).send({ error: error.message });
  }
});

app.post("/retrieve-payment-intent", async (req, res) => {
  const { paymentIntentId } = req.body;

  try {
    const paymentIntent = await stripeInstance.paymentIntents.retrieve(
      paymentIntentId
    );
    const creationTimestamp = new Date(
      paymentIntent.created * 1000
    ).toISOString(); // Convert UNIX timestamp to ISO string

    console.log(
      `Retrieved PaymentIntent with ID: ${paymentIntent.id} at ${creationTimestamp}`
    );

    res.send({
      ...paymentIntent,
      creationTimestamp: creationTimestamp,
    });
  } catch (error) {
    console.error("Error retrieving payment intent:", error);
    res.status(500).send({ error: error.message });
  }
});

app.post("/retrieve-payment-method", async (req, res) => {
  const { paymentMethodId } = req.body;

  try {
    console.log(`Retrieving payment method with ID: ${paymentMethodId}`);
    const paymentMethod = await stripeInstance.paymentMethods.retrieve(
      paymentMethodId
    );
    console.log("Retrieved payment method:", paymentMethod);
    res.send(paymentMethod);
  } catch (error) {
    console.error("Error retrieving payment method:", error);
    res.status(500).send({ error: error.message });
  }
});

app.listen(port, () => console.log(`Server running on port ${port}`));
