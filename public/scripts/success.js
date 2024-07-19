// Helpers
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
}

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

function formatClientAttribution(metadata) {
  if (!metadata) return "N/A";
  return `
    Merchant Integration Version: ${
      metadata.merchant_integration_version || "N/A"
    }<br>
    Client Session ID: ${metadata.client_session_id || "N/A"}<br>
    Merchant Integration Source: ${
      metadata.merchant_integration_source || "N/A"
    }<br>
    Merchant Integration Subtype: ${
      metadata.merchant_integration_subtype || "N/A"
    }<br>
    Payment Intent Creation Flow: ${
      metadata.payment_intent_creation_flow || "N/A"
    }<br>
    Payment Method Selection Flow: ${
      metadata.payment_method_selection_flow || "N/A"
    }
  `;
}

// Retrieve URL parameters
const urlParams = new URLSearchParams(window.location.search);
const paymentIntentClientSecret = urlParams.get("payment_intent_client_secret");
const redirectStatus = urlParams.get("redirect_status");
const creationTimestamp = urlParams.get("creationTimestamp");
const addressData = getCookie("addressData");

// This key should be at .env
const stripePublishableKey =
  "pk_test_51PdfJeCXxlVIqo4hm7ZyfaR4DOQpjvBKWonLDH4Uak5s0AcuMbk55p3wZjCaBOtdzaxJ9gBySx0m3ifVcQquDHIo00iXsWdZoG"; // Replace with your actual key

if (redirectStatus) {
  document.getElementById(
    "payment-intent-status"
  ).innerText = `Status: ${redirectStatus}`;
}

if (creationTimestamp) {
  const date = new Date(creationTimestamp);
  console.log("Parsed Date:", date);
  document.getElementById(
    "payment-timestamp"
  ).innerText = `Order Created At: ${date.toLocaleString()}`;
} else {
  console.error("Creation Timestamp not found in URL");
}

// Parse and format the address data
try {
  const addressObject = JSON.parse(decodeURIComponent(addressData));
  document.getElementById("address-element-data").innerHTML =
    formatAddress(addressObject);
} catch (e) {
  console.error("Failed to parse address data:", e);
  document.getElementById("address-element-data").innerText =
    "Error parsing address data";
}

// Parse and format the payment data
if (paymentIntentClientSecret) {
  const stripe = Stripe(stripePublishableKey); // Initialize Stripe

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
        document.getElementById(
          "payment-intent-amount"
        ).innerText = `Amount: ${(paymentIntent.amount / 100).toFixed(2)}`;
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
          body: JSON.stringify({
            paymentMethodId: paymentIntent.payment_method,
          }),
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
    })
    .catch((error) => {
      console.error("Error retrieving PaymentIntent:", error);
      document.getElementById("payment-intent-id").innerText =
        "Error retrieving payment details";
    });
} else {
  document.getElementById("payment-intent-id").innerText =
    "No payment information available!";
}
