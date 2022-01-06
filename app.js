const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars');
require('dotenv').config();

//KH- added stripe secret key
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

var app = express();

// view engine setup (Handlebars)
app.engine('hbs', exphbs({
  defaultLayout: 'main',
  extname: '.hbs'
}));
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }))
app.use(express.json({}));

/**
 * Home route
 */
app.get('/', function (req, res) {
  res.render('index');
});

/**
 * Checkout route
 */



function getItem(item) {
  let title, amount, error;

  switch (item) {
    case '1':
      title = "The Art of Doing Science and Engineering"
      amount = 2300
      break;
    case '2':
      title = "The Making of Prince of Persia: Journals 1985-1993"
      amount = 2500
      break;
    case '3':
      title = "Working in Public: The Making and Maintenance of Open Source"
      amount = 2800
      break;
    default:
      // Included in layout view, feel free to assign error
      error = "No item selected"
      break;
  }
  return { title: title, amount: amount, error: error }

}

app.get('/checkout', function (req, res) {
  const item = req.query.item;
  var itemDetails = getItem(item)
  res.render('checkout', {
    item: item,
    title: itemDetails.title,
    amount: itemDetails.amount,
    error: itemDetails.error
  });

});



const calculateOrderAmount = (items) => {
  //KH- calculate multiple items (not possible from front end yet)

  let orderAmount = 0;
  for (let i = 0; i < items.length; i++) {
    let itemDetails = getItem(items[i].id)
    orderAmount += itemDetails.amount;
  }
  return orderAmount
};


//KH- added payment intent
app.post("/create-payment-intent", async (req, res) => {
  const { items } = req.body;
  var lineItems = [];

  //KH- preparing to send lineItems in meta data if more than one item is purchased (not possible from front end yet)
  for (let i = 0; i < items.length; i++) {
    let itemDetails = getItem(items[i].id)
    lineItems.push({
      amount: itemDetails.amount,
      title: itemDetails.title
    })
  }


  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: calculateOrderAmount(items),
    currency: "usd",
    metadata: {
      'items': JSON.stringify(lineItems),
    },
    automatic_payment_methods: {
      //KH- automatically will disable/enable payment methods based on currency, 
      // payment method restrictions, and other parameters to determine the list of supported payment methods
      enabled: true,
    },
  });

  res.send({
    //KH- the client secret is needed to complete a payment from the frontend
    clientSecret: paymentIntent.client_secret,
  });
});

app.get("/success", async (req, res) => {

  // KH - using this on the server instead of client to retrieve metadata with item level detes (doesn't populate on client)
  const order = req.query.payment_intent;
  const paymentIntent = await stripe.paymentIntents.retrieve(
    order
  );

  /**
   * Success route
   */

  res.render('success', {
    items: JSON.parse(paymentIntent.metadata.items),
    email: paymentIntent.receipt_email,
    amount: paymentIntent.amount,
    paymentIntent: order
  }
  );
})

/**
 * Start server
 */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('Getting served on port 3000');
});
