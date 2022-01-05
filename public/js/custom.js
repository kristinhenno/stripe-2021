/**
 * Clientside helper functions
 */

$(document).ready(function () {


  // KH- get host for stripe success redirect
  var url;

  if (location.hostname === "localhost") {
    url = "http://localhost:3000";
  }

  else {
    url = "http://sa-project-335905.uc.r.appspot.com";
  }

  //KH- Initialize Stripe.js with your publishable API keys. 
  // You will use Stripe.js to create the Payment Element and complete the payment on the client.

  const stripe = Stripe("pk_test_51K4zqDIkcaZyDXvcuAN8KtdDnxNEpBR5LSLXH1w0dQu4u9UHoogtpDbx1VUoVjPKj1Vcp2A7f3sENVtWjXj8Lo9P00BJW1rail");


  var amounts = document.getElementsByClassName("amount");

  // iterate through all "amount" elements and convert from cents to dollars
  for (var i = 0; i < amounts.length; i++) {

    amount = amounts[i].getAttribute('data-amount') / 100;
    amounts[i].innerHTML = amount.toFixed(2);

  }

  if (document.location.pathname == "/checkout") {

    //KH- get email to send in confirmation of paymentIntent
    var email = document.getElementById("email");
    //KH- get itemId to send to in payment-intent
    var itemId = document.getElementById("item").getAttribute("data-id");
    // The items the customer wants to buy
    const items = [{ id: itemId }];
    let elements;

    initialize();

    document
      .querySelector("#payment-form")
      .addEventListener("submit", handleSubmit);

    // Fetches a payment intent and captures the client secret
    async function initialize() {
      const response = await fetch("/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const { clientSecret } = await response.json();

      const appearance = {
        theme: 'stripe',
      };
      elements = stripe.elements({ appearance, clientSecret });

      const paymentElement = elements.create("payment");
      paymentElement.mount("#payment-element");
    }

    async function handleSubmit(e) {
      //KH- handle email validation
      if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email.value)) {
        e.preventDefault();
        setLoading(true);
        console.log(email.value)

        const { error } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            receipt_email: email.value,
            // Make sure to change this to your payment completion page
            return_url: url + "/success",
          },
        });

        // This point will only be reached if there is an immediate error when confirming the payment.
        if (error.type === "card_error" || error.type === "validation_error") {
          showMessage(error.message);
        } else {
          showMessage("An unexpected error occured.");
        }

        setLoading(false);
      } else {
        e.preventDefault();
        console.log("no email")
        showMessage("Must enter a valid email.")
      }
    }

    // ------- UI helpers -------

    function showMessage(messageText) {
      const messageContainer = document.querySelector("#payment-message");

      messageContainer.classList.remove("hidden");
      messageContainer.textContent = messageText;

      setTimeout(function () {
        messageContainer.classList.add("hidden");
        messageText.textContent = "";
      }, 4000);
    }

    // Show a spinner on payment submission
    function setLoading(isLoading) {
      if (isLoading) {
        // Disable the button and show a spinner
        document.querySelector("#submit").disabled = true;
        document.querySelector("#spinner").classList.remove("hidden");
        document.querySelector("#button-text").classList.add("hidden");
      } else {
        document.querySelector("#submit").disabled = false;
        document.querySelector("#spinner").classList.add("hidden");
        document.querySelector("#button-text").classList.remove("hidden");
      }
    }

  }
})