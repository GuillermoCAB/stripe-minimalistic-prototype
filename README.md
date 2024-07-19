## INSTALL STEPS

- Run `yarn` at the root to install the dependencies.
- Copy content from `.env.example` to your own `.env` file
- Run `yarn start` to run the app at http://localhost:3000  
  <br />
  <br />
  <br />

# SPIKE DOC

<br />

## Payment Element

- The Payment Element allows you to collect payment details in a single, unified UI component. It supports multiple payment methods and dynamically adjusts to display only the methods you’ve configured in the Stripe Dashboard.

## Address Element

- The Address Element can be used to collect address information from your customers, with built-in validation and formatting tailored to the customer’s region.

## Express Payment

- Express Payment options like Apple Pay and Google Pay can be integrated to provide a faster checkout experience. These options leverage the Payment Request Button, a part of Stripe Elements, which offers a streamlined payment process.

<br />

## Credentials Needed for Client-Side Integration (What credentials do we need to support a client-side Stripe integration?)

To integrate Stripe Elements on the client-side, you need the following credentials:

### Publishable API Key:

This key is used on the client side to initialize Stripe.js and create instances of Stripe Elements. It can be found in your Stripe Dashboard under the API keys section.

```js
const secretKey = process.env.NODE_APP_STRIPE_PUBLISHABLE_KEY;

const stripeInstance = stripe(secretKey);
```

### <i>\*Secret API Key (SERVER-SIDE):</i>

While not directly used in the client-side integration, it is used to create PaymentIntents or SetupIntents, this way we can quickly test calls and what data is available to the application.

```js
const secretKey = process.env.NODE_APP_STRIPE_SECRET_KEY;

const stripeInstance = stripe(secretKey);
```

## Capturing Data in the Forms Part 1 - (How do we capture the data in the forms? - Address Element)

### 1 - Initialize Stripe and Elements

Here we do a basic setup of the stripe app passing the PublishableKey to it and initializing the Elements.

```js
// Load Stripe.js
const stripe = Stripe("your-publishable-key");

// Create an instance of Elements from Stripe
const elements = stripe.elements();

// Create a payment-intent
const { clientSecret } = await fetch("/create-payment-intent", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ amount: 2000 }), // Amount in cents ($20.00)
}).then((res) => res.json());

// Initialize elements with the client secret
const stripeElements = stripe.elements({ clientSecret });
```

### 2 - Create and Mount the Elements

Here we define which elements we want to use (payment, address, express) and mount them into an UI component.

```js
// Create an instance of the Payment Element
const paymentElement = elements.create("payment");

// Mount the Payment Element to a DOM element
paymentElement.mount("#payment-element");

// Create and mount the Address Element with mode set to 'shipping' or 'billing'
const addressElement = stripeElements.create("address", { mode: "billing" });
addressElement.mount("#address-element");
```

### 3 - Add listeners to capture the value of the elements

This step is responsible for the actual capture of the values for the address form, added event listener to capture the value changes and stored it in a variable for future use.

```js
// Capture address element input values
addressElement.on("change", (event) => {
  if (event.complete) {
    addressJSON = event.value;
  }
});
```

### 4 - Handle Form Submission & Cookie setup

Here we store the previously saved data into a cookie to use afterward, we could store this data on the `onChange` event as well if needed, but in this example, it made sense for me to wait until the user added all data and click to submit the form before storing it. Also, we can store the data into a variable in a redux, context, localStorage, some API, or wherever we see fit, this is just one example using the cookie but we can go with some other approach here as needed.

```js
const form = document.getElementById("payment-form");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  // Set cookie with address data & addressElement
  document.cookie = `addressData=${encodeURIComponent(
    JSON.stringify({
      ...addressJSON,
      componentMode: addressElement._componentMode,
    })
  )}; path=/`;

  //...rest of the payment handling logic
});
```

### 5 - Using captured data

In this example, we'll parse the previously created cookie and use the data there to render information into the UI so we can showcase the flow of capturing data from Stripe Elements

```js
// Function to parse the cookie
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
}

// Function to format address data
function formatAddress(address) {
  if (!address) return "N/A";
  return `
            Name: ${address.name || "N/A"}<br>
            Address Line 1: ${address.address.line1 || "N/A"}<br>
            Address Line 2: ${address.address.line2 || "N/A"}<br>
            City: ${address.address.city || "N/A"}<br>
            State: ${address.address.state || "N/A"}<br>
            Country: ${address.address.country || "N/A"}<br>
            Postal Code: ${address.address.postal_code || "N/A"}
        `;
}

const addressData = getCookie("addressData");
const addressObject = JSON.parse(decodeURIComponent(addressData));
document.getElementById("address-element-data").innerHTML =
  formatAddress(addressObject);
```

<br />

## Capturing Data in the Forms Part 2 - (How do we capture the data in the forms? - Payment Element)

For the payment element steps 1 and 2 are the same, we need to set up Stripe and then mount the Element we want to use into the UI, the difference is that after that we don't need to add any event listener because the data for the payment is private. So instead we just proceed with the payment flow and after that was done we used the `retrievePaymentIntent`method from Stripe to retrieve the related data as shown here:

```js
// Function to format card details
function formatCardDetails(card) {
  if (!card) return "N/A";
  return `
            Brand: ${card.brand || "N/A"}<br>
            Last 4 Card Number: ${card.last4 || "N/A"}<br>
            Expiry Month: ${card.exp_month || "N/A"}<br>
            Expiry Year: ${card.exp_year || "N/A"}<br>
            Funding: ${card.funding || "N/A"}<br>
            Country: ${card.country || "N/A"}
        `;
}

// Retrieve the PaymentIntent
stripe
  .retrievePaymentIntent(paymentIntentClientSecret)
  .then(({ paymentIntent }) => {
    if (paymentIntent) {
      document.getElementById(
        "payment-intent-id"
      ).innerText = `Payment Intent ID: ${paymentIntent.id}`;
      document.getElementById(
        "payment-intent-status"
      ).innerText = `Status: ${paymentIntent.status}`;
      document.getElementById("payment-intent-amount").innerText = `Amount: ${(
        paymentIntent.amount / 100
      ).toFixed(2)}`;
      document.getElementById(
        "payment-intent-currency"
      ).innerText = `Currency: ${paymentIntent.currency.toUpperCase()}`;
      document.getElementById(
        "payment-intent-email"
      ).innerText = `Customer Email: ${paymentIntent.receipt_email || "N/A"}`;

      // Retrieve the PaymentMethod details from server
      fetch("/retrieve-payment-method", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paymentMethodId: paymentIntent.payment_method }),
      })
        .then((response) => response.json())
        .then((paymentMethod) => {
          console.log("Retrieved paymentMethod:", paymentMethod);

          if (paymentMethod && paymentMethod.card) {
            document.getElementById("card-details").innerHTML =
              formatCardDetails(paymentMethod.card);
          } else {
            document.getElementById("card-details").innerText =
              "No card details available!";
          }

          if (paymentMethod && paymentMethod.metadata) {
            document.getElementById("client-attribution-metadata").innerHTML =
              formatClientAttribution(paymentMethod.metadata);
          } else {
            document.getElementById("client-attribution-metadata").innerText =
              "No client attribution metadata available!";
          }
        })
        .catch((error) => {
          console.error("Error retrieving PaymentMethod:", error);
          document.getElementById("card-details").innerText =
            "Error retrieving card details";
          document.getElementById("client-attribution-metadata").innerText =
            "Error retrieving client attribution metadata";
        });
    } else {
      document.getElementById("payment-intent-id").innerText =
        "Payment Intent not found!";
    }
  });
```

<br />

## How is this different from the current implementation of Address & Payment forms?

Today at `lovevery-checkout` we use a mix of some outdated stripe components like CardElement, PaymentRequestButtonElement and IdealBankElement, with our own logic and components. With the new approach we can just use the previously shown stripe elements and they will create all the flow with all the necessary elements, so instead of having a lot of files (e.g. PaymentInformation, PaymentMethodSelector, PaymentOptions, WalletPaymentRequest, CardElement, etc) we can just use the Stripe Payment Element and the Address Element, and all the necessary UI will already be done.

On the data handling side, we may need to add some logic to our BE to handle the necessary stripe events based on the following [stripe doc](https://docs.stripe.com/checkout/custom-checkout) (maybe we already have that because we were already using stripe and the flow shouldn't change much with the new Elements), but this is really straightforward as far as I saw in this Spike and even if we need to update shouldn't be much work, definitely less than recreating all the components, forms, validations, etc as we did in the previous `lovevery-checkout`

## Using with React

On react we have dedicated libs that can provided the components and methods from stripe. The components are the same, and the set up process is similar, the only thing worth mention is that for the Address Element we have access to the `onChange` method, so we don't need the event listeners.

```js
import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  LinkAuthenticationElement,
  PaymentElement,
  AddressElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const PaymentForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [messages, setMessages] = useState("");
  const [addressState, setAddressState] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessages(`${messages}<br />Submitting payment...`);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: "http://localhost:3000/success",
      },
    });

    if (error) {
      setMessages(`${messages}<br />${error.message}`);
    }
  };

  return (
    <div className="sr-root">
      <div className="sr-main">
        <h1>Accept a payment</h1>

        <form onSubmit={handleSubmit}>
          <h3>Contact info</h3>
          <LinkAuthenticationElement />

          <h3>Shipping address</h3>
          <AddressElement
            options={{ mode: "shipping", allowedCountries: ["US"] }}
            onChange={(event) => {
              setAddressState(event.value);
            }}
          />

          <h3>Payment</h3>
          <PaymentElement />
          <button type="submit">Pay</button>
        </form>

        <div id="messages">{messages}</div>
      </div>
    </div>
  );
};

// Customize the appearance of Elements using the Appearance API.
const appearance = {
  theme: "stripe",
  variables: {
    colorPrimary: "#ed5f74",
    borderRadius: "20px",
    fontFamily:
      "--body-font-family: -apple-system, BlinkMacSystemFont, sans-serif",
    colorBackground: "#fafafa",
  },
};

const Checkout = ({ stripePromise }) => {
  const [clientSecret, setClientSecret] = useState(null);

  useEffect(() => {
    // Create PaymentIntent as soon as the page loads
    fetch("/create-payment-intent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then(({ clientSecret }) => setClientSecret(clientSecret));
  }, []);

  if (clientSecret) {
    return (
      <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
        <PaymentForm />
      </Elements>
    );
  } else {
    return <div>Loading...</div>;
  }
};

export { Checkout };
```
