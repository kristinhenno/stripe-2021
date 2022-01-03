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

let title, amount, error;

function getItem(item) {

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

}

app.get('/checkout', function (req, res) {
  const item = req.query.item;

  getItem(item)

  res.render('checkout', {
    item: item,
    title: title,
    amount: amount,
    error: error
  });

});




const calculateOrderAmount = (items) => {
  //KH- ability to calculate multiple items
  let orderAmount = 0;
  for (let i = 0; i < items.length; i++) {
    getItem(items[i].id)
    orderAmount = orderAmount + amount;
  }
  return orderAmount
};


//KH- added payment intent
app.post("/create-payment-intent", async (req, res) => {
  const { items } = req.body;
  const { email } = req.body;

  var lineItems = [];


  //KH- preparing to send lineItems in meta data
  for (let i = 0; i < items.length; i++) {
    getItem(items[i].id)

    lineItems.push({
      amount: amount,
      title: title
    })
    console.log(lineItems)
  }


  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: calculateOrderAmount(items),
    currency: "usd",
    //send customer email for receipt
    receipt_email: email,
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
    //KH- the client secret can be used to complete a payment from the frontend
    clientSecret: paymentIntent.client_secret,
  });
});

app.get("/success", async (req, res) => {

  const order = req.query.payment_intent;


  const paymentIntent = await stripe.paymentIntents.retrieve(
    order
  );

  console.log(paymentIntent)

  /**
   * Success route
   */

  res.render('success', {
    items: JSON.parse(paymentIntent.metadata.items),
    email: paymentIntent.receipt_email,
    amount: paymentIntent.amount
  });

  // res.send({
  //   //KH- the client secret can be used to complete a payment from the frontend
  //   items: paymentIntent
  // });

})

/**
 * Start server
 */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('Getting served on port 3000');
});
