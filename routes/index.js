const express = require('express');
const router = express.Router();
const colors = require('colors');
const stripHtml = require('string-strip-html');
var moment = require('moment-timezone');
const _ = require('lodash');
const common = require('../lib/common');
const mailer = require('../misc/mailer');
const { indexOrders } = require('../lib/indexing');
const numeral = require('numeral');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const {
    getId,
    hooker,
    clearSessionValue,
    sortMenu,
    getMenu,
    getPaymentConfig,
    getImages,
    updateTotalCart,
    emptyCart,
    updateSubscriptionCheck,
    paginateProducts,
    getSort,
    addSitemapProducts,
    getCountryList
} = require('../lib/common');
const countryList = getCountryList();
var keyid = "rzp_live_BB6pHJLZdvUA7t";
var keysecret = "wXaUfsRdgaRQptIteCItdOwl";
var instance = new Razorpay({
    key_id: keyid,
    key_secret: keysecret
  })

//This is how we take checkout action

router.post('/checkout_action',async (req, res, next) => {
    const db = req.app.db;
    const config = req.app.config;

    
    var customerObj = {};
    if(req.body.shipFirstname) {
        customerObj["firstName"] = req.body.shipFirstname;
    }
 
    if(req.body.shipLastname) {
        customerObj["lastName"] = req.body.shipLastname;
    }
    if(req.body.shipAddr1) {
        customerObj["addressline"] = req.body.shipAddr1;
    }
    if(req.body.shipState) {
        customerObj["state"] = req.body.shipState;
    }
    if(req.body.shipPostcode) {
        customerObj["postcode"] = req.body.shipPostcode;
    }
    await db.customers.findOneAndUpdate({_id: common.getId(req.session.customerId)},{$set: customerObj});
    var customer = await db.customers.findOne({_id: common.getId(req.session.customerId)});
        // order status
        let paymentStatus = 'Paid';
     
        // new order doc
        const orderDoc = {
           // orderPaymentId: charge.id,
          //  orderPaymentGateway: 'Stripe',
           // orderPaymentMessage: charge.outcome.seller_message,
            orderTotal: req.session.totalCartAmount,
            orderShipping: req.session.totalCartShipping,
            orderItemCount: req.session.totalCartItems,
            orderProductCount: req.session.totalCartProducts,
            orderCustomer: common.getId(req.session.customerId),
            orderEmail: req.session.customerEmail,
           // orderCompany: req.session.customerCompany,
            orderFirstname: customer.firstName,
            orderLastname: customer.lastName,
            orderAddr1: customer.addressline,
           // orderAddr2: req.session.customerAddress2,
          //  orderCountry: req.session.customerCountry,
            orderState: customer.state,
            orderPostcode: customer.postcode,
            orderPhoneNumber: req.session.customerPhone,
            //orderComment: req.session.orderComment,
            orderStatus: paymentStatus,
            orderDate: new Date(),
            orderProducts: req.session.cart,
            orderType: 'Single'
        };
        
        // insert order into DB
        db.orders.insertOne(orderDoc, (err, newDoc) => {
            if(err){
                console.info(err.stack);
            }

            // get the new ID
            const newId = newDoc.insertedId;

            // add to lunr index
            indexOrders(req.app)
            .then(async () => {
                // if approved, send email etc
                    // set the results
                    req.session.messageType = 'success';
                    req.session.message = 'Your payment was successfully completed';
                    req.session.paymentEmailAddr = newDoc.ops[0].orderEmail;
                    req.session.paymentApproved = true;
                    req.session.paymentDetails = '<p><strong>Order ID: </strong>' + newId ;

                    // set payment results for email
                    const paymentResults = {
                        message: req.session.message,
                        messageType: req.session.messageType,
                        paymentEmailAddr: req.session.paymentEmailAddr,
                        paymentApproved: true,
                        paymentDetails: req.session.paymentDetails
                    };

                    // clear the cart
                    if(req.session.cart){
                        common.emptyCart(req, res, 'function');
                    }
                    const html=`Thanku from ordering from BnB Herbs`;
                    // send the email with the response
                    // TODO: Should fix this to properly handle result
                    //common.sendEmail(req.session.paymentEmailAddr, 'Your payment with ' + config.cartTitle, common.getEmailTemplate(paymentResults));
                
                   console.log("Session email Id is here"+req.session.customerEmail);
                   try
                   {
                    await mailer.sendEmail('admin@bnbherbs.in',req.session.customerEmail,'Order Complete',html)
                   }
                    catch(err)
                    {
                        console.log(err);   
                    }
                    // redirect to outcome
                    res.redirect('/payment/' + newId);
                
            });
        });
    });
// });

// These is the customer facing routes
router.get('/payment/:orderId', async (req, res, next) => {
    const db = req.app.db;
    const config = req.app.config;

    // Get the order
    const order = await db.orders.findOne({ _id: getId(req.params.orderId) });
    if(!order){
        res.render('error', { title: 'Not found', message: 'Order not found', helpers: req.handlebars.helpers, config });
        return;
    }

    res.render('success', {
        title: 'Payment complete',
        config: req.app.config,
        categories: req.app.categories,
        session: req.session,
        result: order,
        message: clearSessionValue(req.session, 'message'),
        messageType: clearSessionValue(req.session, 'messageType'),
        helpers: req.handlebars.helpers,
        showFooter: 'showFooter',
    });
});

router.get('/emptycart', async (req, res, next) => {
    emptyCart(req, res, '');
});
router.post('/checkout/order/reset', async (req,res)=>{
    req.session.orderidgenerated = false;
    req.session.razorOrderId = null;
    res.status(200).json({message: "Reset Successfull"});
    return;
});
router.post('/checkout/order/new',async (req,res)=>{
    
    
    if(!req.body.firstName || !req.body.lastName || !req.body.address || !req.body.state || !req.body.postcode ) {
        res.status(400).json({message: "Name, Address and Postcode is Required"});
        return;
    }
    req.session.firstName = req.body.firstName;
    req.session.lastName = req.body.lastName;
    req.session.address = req.body.address;
    req.session.state = req.body.state;
    req.session.postcode = req.body.postcode;
    var amount = parseInt(Number(req.session.totalCartAmount) * 100);
    var options = {
        amount: amount,  // amount in the smallest currency unit
        currency: "INR",
        receipt: "rcptid_11"
      };
      req.session.razorpayamount = amount;
      console.log(options);
      var orderid = '';
      instance.orders.create(options, function(err, order) {
          if(err){
              console.log(err);
          }
        console.log(order);
        req.session.orderidgenerated = true;
        orderid = order.id;
        req.session.razorOrderId = order.id;
        res.status(200).send({message: order.id});
        return;
      });     
});
router.post('/checkout/order/set', async (req,res)=>{
    console.log("checkout set session",req.body.order_id);
    req.session.razororderId = req.body.order_id;
    req.session.razoridgenerated = true;
    return;
});
router.get('/checkout/pay',async (req,res)=>{
    var db = req.app.db;
    const order = await db.orders.findOne({_id: common.getId(req.session.orderdbpay)});
    if(!order){
        req.session.message = "No Order for this payment";
        req.session.messageType = "danger";
        res.redirect('/customer/account');
        return;
    }
    res.render('payamount',{
        title: "Payment Gateway",
        config: req.app.config,
        session: req.session,
        categories: req.app.categories,
        order: order,
        razorpayid: req.session["razorOrderId"],
        razoramount: req.session["razorpayamount"],
        keyId: "rzp_test_rBXuI8IeffKFxy",
        message: clearSessionValue(req.session, 'message'),
        messageType: clearSessionValue(req.session, 'messageType'),
        helpers: req.handlebars.helpers,
        showFoooter: 'showFooter'
    });
});
router.post('/checkout/confirm/razorpay',async (req,res)=>{
    const db = req.app.db;
    var bodymessage = req.body.razorpay_order_id + `|` + req.body.razorpay_payment_id;
    console.log(req.body);
    var secret = "doUGurZrLU4jd4ZIj65Gbfpn"; // from the dashboard
    var generated_signature = crypto.createHmac("sha256",secret).update(bodymessage.toString()).digest('hex');
    console.log(generated_signature);
    console.log(req.body.razorpay_signature);
  if (req.body.razorpay_signature && generated_signature == req.body.razorpay_signature) {    
  
 
var customerObj = {
    "firstName": req.session.firstName,
    "lastName": req.session.lastName,
    "state": req.session.state,
    "postcode": req.session.postcode,
    "address": req.session.address
};
await db.customers.findOneAndUpdate({_id: common.getId(req.session.customerId)},{$set: customerObj});
var customer = await db.customers.findOne({_id: common.getId(req.session.customerId)});
    // order status
    let paymentStatus = 'Paid';
 
    // new order doc
    const orderDoc = {
       // orderPaymentId: charge.id,
      //  orderPaymentGateway: 'Stripe',
       // orderPaymentMessage: charge.outcome.seller_message,
        orderTotal: req.session.totalCartAmount,
        orderShipping: req.session.totalCartShipping,
        orderItemCount: req.session.totalCartItems,
        orderProductCount: req.session.totalCartProducts,
        orderCustomer: common.getId(req.session.customerId),
        orderEmail: req.session.customerEmail,
       // orderCompany: req.session.customerCompany,
        orderFirstname: customer.firstName,
        orderLastname: customer.lastName,
        orderAddr1: customer.addressline,
       // orderAddr2: req.session.customerAddress2,
      //  orderCountry: req.session.customerCountry,
        orderState: customer.state,
        orderPostcode: customer.postcode,
        orderPhoneNumber: req.session.customerPhone,
        //orderComment: req.session.orderComment,
        orderStatus: paymentStatus,
        orderDate: new Date(),
        orderProducts: req.session.cart,
        orderType: 'Single'
    };
    
    // insert order into DB
    db.orders.insertOne(orderDoc, (err, newDoc) => {
        if(err){
            console.info(err.stack);
        }

        // get the new ID
        const newId = newDoc.insertedId;

        // add to lunr index
        indexOrders(req.app)
        .then(() => {
            // if approved, send email etc
                // set the results
                req.session.messageType = 'success';
                req.session.message = 'Your payment was successfully completed';
                req.session.paymentEmailAddr = newDoc.ops[0].orderEmail;
                req.session.paymentApproved = true;
                req.session.paymentDetails = '<p><strong>Order ID: </strong>' + newId ;

                // set payment results for email
                const paymentResults = {
                    message: req.session.message,
                    messageType: req.session.messageType,
                    paymentEmailAddr: req.session.paymentEmailAddr,
                    paymentApproved: true,
                    paymentDetails: req.session.paymentDetails
                };

                // clear the cart
                if(req.session.cart){
                    common.emptyCart(req, res, 'function');
                }

                // send the email with the response
                // TODO: Should fix this to properly handle result
                common.sendEmail(req.session.paymentEmailAddr, 'Your payment with ' + config.cartTitle, common.getEmailTemplate(paymentResults));

                // redirect to outcome
                res.status(200).json({id: newId});
                return;
            
        });
    });
}
else  {
    res.status(400).json({message: "Payment Failed"});
    return;
}
  });

  router.get('/success',async (req,res)=>{
      const db = req.app.db;
      var order = await db.orders.findOne({_id: common.getId(req.session.orderdbpay)});
      req.session.orderdbpay = null;
    res.render('success', {
        title: 'Payment complete',
        categories: req.app.categories,
        config: req.app.config,
        session: req.session,
        result: order,
        message: clearSessionValue(req.session, 'message'),
        messageType: clearSessionValue(req.session, 'messageType'),
        helpers: req.handlebars.helpers,
        showFooter: 'showFooter',
    });
  });

router.get('/checkout/information', async (req, res, next) => {
    const config = req.app.config;
    const db = req.app.db;

    const customerArray = await db.customers.findOne({
        _id: common.getId(req.session.customerId)});

    // if there is no items in the cart then render a failure
    if(!req.session.cart){
        req.session.message = 'The are no items in your cart. Please add some items before checking out';
        req.session.messageType = 'danger';
        res.redirect('/');
        return;
    }
    if(!req.session.customerPresent){
        req.session.message = 'Login Required';
        req.session.messageType = 'danger';
        res.redirect('/customer/login');
        return;
    }

    let paymentType = '';
    if(req.session.cartSubscription){
        paymentType = '_subscription';
    }

    // render the payment page
    res.render(`${config.themeViews}checkout-information`, {
        title: 'Checkout - Information',
        config: req.app.config,
        session: req.session,
        categories: req.app.categories,
        customerArray: customerArray,
        razorpayid: req.session["razorOrderId"],
        razoramount: req.session["razorpayamount"],
        keyId: "rzp_test_Q4SdVCKHGsa45S",
        paymentType,
        cartClose: false,
        page: 'checkout-information',
        countryList,
        message: clearSessionValue(req.session, 'message'),
        messageType: clearSessionValue(req.session, 'messageType'),
        helpers: req.handlebars.helpers,
    });
});

router.get('/checkout/shipping', async (req, res, next) => {
    const config = req.app.config;

    // if there is no items in the cart then render a failure
    if(!req.session.cart){
        req.session.message = 'The are no items in your cart. Please add some items before checking out';
        req.session.messageType = 'danger';
        res.redirect('/');
        return;
    }

    if(!req.session.customerEmail){
        req.session.message = 'Cannot proceed to shipping without customer information';
        req.session.messageType = 'danger';
        res.redirect('/checkout/information');
        return;
    }

    // Net cart amount
    const netCartAmount = req.session.totalCartAmount - req.session.totalCartShipping || 0;

    // Recalculate shipping
    config.modules.loaded.shipping.calculateShipping(
        netCartAmount,
        config,
        req
    );

    // render the payment page
    res.render(`${config.themeViews}checkout-shipping`, {
        title: 'Checkout - Shipping',
        config: req.app.config,
        session: req.session,
        cartClose: false,
        cartReadOnly: true,
        page: 'checkout-shipping',
        countryList,
        message: clearSessionValue(req.session, 'message'),
        messageType: clearSessionValue(req.session, 'messageType'),
        helpers: req.handlebars.helpers,
        showFooter: 'showFooter'
    });
});

router.get('/checkout/cart', async(req, res) => {
    const config = req.app.config;
    const db = req.app.db;
    var newuserdiscount = [];
    var discounts = await db.discounts.find({isHide: false,new: "No",minimum: {$gt : 0}}).toArray();
    var discounts2 = [];
    var ordes = await db.orders.findOne({orderCustomer: getId(req.session.customerId)});
    if(!ordes && req.session.customerPresent) {
        newuserdiscount = await db.discounts.find({isHide: false,new: "Yes"}).toArray();
    }
    for(var i=0;i<discounts.length;i++){
        if(discounts[i].onceUser) {
            if(req.session.customerPresent) {
            var temptest = await db.orders.findOne({orderCustomer: getId(req.session.customerId), orderPromoCode: discounts[i].code});
            if(!temptest) {
                discounts2.push(discounts[i]);
            }
        }
        }
        else {
            discounts2.push(discounts[i]);
        }
    }
    res.render(`${config.themeViews}checkout-cart`, {
        title: 'Checkout - Cart',
        page: req.query.path,
        config,
        categories: req.app.categories,
        discounts: discounts2,
        newuserdiscount: newuserdiscount,
        session: req.session,
        message: clearSessionValue(req.session, 'message'),
        messageType: clearSessionValue(req.session, 'messageType'),
        helpers: req.handlebars.helpers,
        showFooter: 'showFooter'
    });
});

router.get('/checkout/cartdata', (req, res) => {
    const config = req.app.config;

    res.status(200).json({
        cart: req.session.cart,
        session: req.session,
        currencySymbol: config.currencySymbol || '$'
    });
});

router.get('/checkout/payment', async (req, res) => {
    const config = req.app.config;

    // if there is no items in the cart then render a failure
    if(!req.session.cart){
        req.session.message = 'The are no items in your cart. Please add some items before checking out';
        req.session.messageType = 'danger';
        res.redirect('/');
        return;
    }

    let paymentType = '';
    if(req.session.cartSubscription){
        paymentType = '_subscription';
    }

    // update total cart amount one last time before payment
    await updateTotalCart(req, res);

    res.render(`${config.themeViews}checkout-payment`, {
        title: 'Checkout - Payment',
        config: req.app.config,
        paymentConfig: getPaymentConfig(),
        categories: req.app.categories,
        session: req.session,
        paymentPage: true,
        paymentType,
        cartClose: true,
        cartReadOnly: true,
        page: 'checkout-information',
        countryList,
        message: clearSessionValue(req.session, 'message'),
        messageType: clearSessionValue(req.session, 'messageType'),
        helpers: req.handlebars.helpers,
        showFooter: 'showFooter'
    });
});

router.get('/blockonomics_payment', (req, res, next) => {
    const config = req.app.config;
    let paymentType = '';
    if(req.session.cartSubscription){
        paymentType = '_subscription';
    }
// show bitcoin address and wait for payment, subscribing to wss

    res.render(`${config.themeViews}checkout-blockonomics`, {
        title: 'Checkout - Payment',
        config: req.app.config,
        paymentConfig: getPaymentConfig(),
        session: req.session,
        categories: req.app.categories,
        paymentPage: true,
        paymentType,
        cartClose: true,
        cartReadOnly: true,
        page: 'checkout-information',
        countryList,
        message: clearSessionValue(req.session, 'message'),
        messageType: clearSessionValue(req.session, 'messageType'),
        helpers: req.handlebars.helpers,
        showFooter: 'showFooter'
    });
});

router.post('/checkout/adddiscountcode', async (req, res) => {
    const config = req.app.config;
    const db = req.app.db;

    // if there is no items in the cart return a failure
    if(!req.session.cart){
        res.status(400).json({
            message: 'The are no items in your cart.'
        });
        return;
    }

    // Check if the discount module is loaded
    if(!config.modules.loaded.discount){
        res.status(400).json({
            message: 'Access denied.'
        });
        return;
    }

    // Check defined or null
    if(!req.body.discountCode || req.body.discountCode === ''){
        res.status(400).json({
            message: 'Discount code is invalid or expired'
        });
        return;
    }

    // Validate discount code
    const discount = await db.discounts.findOne({ code: req.body.discountCode });
    if(!discount){
        res.status(400).json({
            message: 'Discount code is invalid or expired'
        });
        return;
    }

    // Validate date validity
    if(!moment().isBetween(moment(discount.start), moment(discount.end))){
        res.status(400).json({
            message: 'Discount is expired'
        });
        return;
    }

    // Set the discount code
    req.session.discountCode = discount.code;

    // Update the cart amount
    await updateTotalCart(req, res);

    // Return the message
    res.status(200).json({
        message: 'Discount code applied'
    });
});

router.post('/checkout/removediscountcode', async (req, res) => {
    // if there is no items in the cart return a failure
    if(!req.session.cart){
        res.status(400).json({
            message: 'The are no items in your cart.'
        });
        return;
    }

    // Delete the discount code
    delete req.session.discountCode;

    // update total cart amount
    await updateTotalCart(req, res);

    // Return the message
    res.status(200).json({
        message: 'Discount code removed'
    });
});

// show an individual product
router.get('/product/:id', async (req, res) => {
    const db = req.app.db;
    const config = req.app.config;
    const productsIndex = req.app.productsIndex;
    var editreviewPermission = false;
    var reviewPermission = false;
    var rdata = {};
    const product = await db.products.findOne({ $or: [{ _id: getId(req.params.id) }, { productPermalink: req.params.id }] });
    const existvalue = "orderProducts.".concat(product._id);
    const ordersUser = await db.orders.findOne({$and: [{ orderCustomer: getId(req.session.customerId) }, { [existvalue] : { $exists : true } }] });
    const reviewUser = await db.reviews.findOne({ $and: [{ productId: getId(product._id) }, { userId: getId(req.session.customerId) }] });
    const reviewslist = await db.reviews.find({ productId: getId(product._id) }).toArray();
    var date = moment(new Date(), 'DD/MM/YYYY HH:mm').toDate().toString().split('GMT')[0].concat("GMT+0530 (GMT+05:30)");
    const offers = await db.discounts.find({}).toArray();
    var firstoffer = null;
    var secondoffer = null;
    for(let a in offers){
        if(moment(new Date(date)).isBetween(new Date(offers[a].start), new Date(offers[a].end))) {
            if(secondoffer){
                break;
            }
            else if(firstoffer){
                secondoffer = offers[a];
            }
            else {
                firstoffer = offers[a];
            }
        }
    }
    if(!reviewslist){
        reviewslist = false;
    }
    if(reviewUser && req.session.customerPresent) {
        editreviewPermission = true;
        rdata.title = reviewUser.title;
        rdata.description = reviewUser.description;
    }
    else if(ordersUser && req.session.customerPresent ) {
        reviewPermission = true;
    }
    if(!product){
        res.render('error', { title: 'Not found', message: 'Product not found', helpers: req.handlebars.helpers, config });
        return;
    }
    if(product.productPublished === false){
        res.render('error', { title: 'Not found', message: 'Product not found', helpers: req.handlebars.helpers, config });
        return;
    }

    // Get variants for this product
    const variants = await db.variants.find({ product: product._id }).sort({ added: 1 }).toArray();

    // If JSON query param return json instead
    if(req.query.json === 'true'){
        res.status(200).json(product);
        return;
    }

    // show the view
    const images = await getImages(product._id, req, res);

    // Related products
    let relatedProducts = {};
    if(config.showRelatedProducts){
        const lunrIdArray = [];
        // const productTags = product.productTags.split(',');
        const productTitleWords = product.productTitle.split(' ');
        // const searchWords = productTags.concat(productTitleWords);
        const searchWords = productTitleWords;
            productsIndex.search(product.productTitle).forEach((id) => {
                lunrIdArray.push(getId(id.ref));
            });
        relatedProducts = await db.products.find({
            _id: { $in: lunrIdArray, $ne: product._id },
            productPublished: true
        }).limit(4).toArray();
    }

    console.log(product);

    res.render(`${config.themeViews}product`, {
        title: product.productTitle,
        result: product,
        variants,
        images: images,
        firstoffer: firstoffer,
        secondoffer: secondoffer,
        relatedProducts,
        productDescription: stripHtml(product.productDescription),
        metaDescription: config.cartTitle + ' - ' + product.productTitle,
        config: config,
        categories: req.app.categories,
        reviewPermission: reviewPermission,
        editreviewPermission: editreviewPermission,
        reviews: reviewslist,
        rdata, rdata,
        session: req.session,
        pageUrl: config.baseUrl + req.originalUrl,
        message: clearSessionValue(req.session, 'message'),
        messageType: clearSessionValue(req.session, 'messageType'),
        helpers: req.handlebars.helpers,
        showFooter: 'showFooter',
        menu: sortMenu(await getMenu(db))
    });
});

// Gets the current cart
router.get('/cart/retrieve', async (req, res, next) => {
    const db = req.app.db;

    // Get the cart from the DB using the session id
    let cart = await db.cart.findOne({ sessionId: getId(req.session.id) });

    // Check for empty/null cart
    if(!cart){
        cart = [];
    }

    res.status(200).json({ cart: cart.cart });
});

// Updates a single product quantity
router.post('/product/updatecart', async (req, res, next) => {
    const db = req.app.db;
    const config = req.app.config;
    const cartItem = req.body;

    // Check cart exists
    if(!req.session.cart){
        emptyCart(req, res, 'json', 'There are no items if your cart or your cart is expired');
        return;
    }

    const product = await db.products.findOne({ _id: getId(cartItem.productId) });
    if(!product){
        res.status(400).json({ message: 'There was an error updating the cart', totalCartItems: Object.keys(req.session.cart).length });
        return;
    }

    // Calculate the quantity to update
    let productQuantity = cartItem.quantity ? cartItem.quantity : 1;
    if(typeof productQuantity === 'string'){
        productQuantity = parseInt(productQuantity);
    }

    if(productQuantity === 0){
        // quantity equals zero so we remove the item
        delete req.session.cart[cartItem.cartId];
        res.status(400).json({ message: 'There was an error updating the cart', totalCartItems: Object.keys(req.session.cart).length });
        return;
    }

    // Check for a cart
    if(!req.session.cart[cartItem.cartId]){
        res.status(400).json({ message: 'There was an error updating the cart', totalCartItems: Object.keys(req.session.cart).length });
        return;
    }

    const cartProduct = req.session.cart[cartItem.cartId];

    // Set default stock
    let productStock = product.productStock;
    let productPrice = parseFloat(product.productPrice).toFixed(2);

    // Check if a variant is supplied and override values
    if(cartProduct.variantId){
        const variant = await db.variants.findOne({
            _id: getId(cartProduct.variantId),
            product: getId(product._id)
        });
        if(!variant){
            res.status(400).json({ message: 'Error updating cart. Please try again.' });
            return;
        }
        productPrice = parseFloat(variant.price).toFixed(2);
        productStock = variant.stock;
    }

    // If stock management on check there is sufficient stock for this product
    if(config.trackStock){
        // Only if not disabled
        if(product.productStockDisable !== true && productStock){
            // If there is more stock than total (ignoring held)
            if(productQuantity > productStock){
                res.status(400).json({ message: 'There is insufficient stock of this product.' });
                return;
            }

            // Aggregate our current stock held from all users carts
            const stockHeld = await db.cart.aggregate([
                { $match: { sessionId: { $ne: req.session.id } } },
                { $project: { _id: 0 } },
                { $project: { o: { $objectToArray: '$cart' } } },
                { $unwind: '$o' },
                { $group: {
                    _id: {
                        $ifNull: ['$o.v.variantId', '$o.v.productId']
                    },
                    sumHeld: { $sum: '$o.v.quantity' }
                } }
            ]).toArray();

            // If there is stock
            if(stockHeld.length > 0){
                const totalHeld = _.find(stockHeld, ['_id', getId(cartItem.cartId)]).sumHeld;
                const netStock = productStock - totalHeld;

                // Check there is sufficient stock
                if(productQuantity > netStock){
                    res.status(400).json({ message: 'There is insufficient stock of this product.' });
                    return;
                }
            }
        }
    }

    // Update the cart
    req.session.cart[cartItem.cartId].quantity = productQuantity;
    req.session.cart[cartItem.cartId].totalItemPrice = productPrice * productQuantity;

    // update total cart amount
    await updateTotalCart(req, res);

    // Update checking cart for subscription
    updateSubscriptionCheck(req, res);

    // Update cart to the DB
    await db.cart.updateOne({ sessionId: req.session.id }, {
        $set: { cart: req.session.cart }
    });

    res.status(200).json({ message: 'Cart successfully updated', totalCartItems: Object.keys(req.session.cart).length });
});

// Remove single product from cart
router.post('/product/removefromcart', async (req, res, next) => {
    const db = req.app.db;

    // Check for item in cart
    
    if(!req.session.cart[req.body.cartId]){
        return res.status(400).json({ message: 'Product not found in cart' });
    }

    // remove item from cart
    delete req.session.cart[req.body.cartId];

    // If not items in cart, empty it
    if(Object.keys(req.session.cart).length === 0){
        return emptyCart(req, res, 'json');
    }

    // Update cart in DB
    await db.cart.updateOne({ sessionId: req.session.id }, {
        $set: { cart: req.session.cart }
    });
    // update total cart
    await updateTotalCart(req, res);

    // Update checking cart for subscription
    updateSubscriptionCheck(req, res);

    return res.status(200).json({ message: 'Product successfully removed', totalCartItems: Object.keys(req.session.cart).length });
});

// Totally empty the cart
router.post('/product/emptycart', async (req, res, next) => {
    emptyCart(req, res, 'json');
});

// Add item to cart
router.post('/product/addtocart', async (req, res, next) => {
    const db = req.app.db;
    const config = req.app.config;
    
    // setup cart object if it doesn't exist
    if(!req.session.cart){
        req.session.cart = {};
    }

    // Get the product from the DB
    const product = await db.products.findOne({ _id: getId(req.body.productId) });

    // No product found
    if(!product){
        return res.status(400).json({ message: 'Error updating cart. Please try again.' });
    }

    // If cart already has a subscription you cannot add anything else
    if(req.session.cartSubscription){
        return res.status(400).json({ message: 'Subscription already existing in cart. You cannot add more.' });
    }

    // If existing cart isn't empty check if product is a subscription
    if(Object.keys(req.session.cart).length !== 0){
        if(product.productSubscription){
            return res.status(400).json({ message: 'You cannot combine subscription products with existing in your cart. Empty your cart and try again.' });
        }
    }

    // Variant checks
    let productCartId = product._id.toString();
    let productPrice = parseFloat(product.productPrice).toFixed(2);
    let productStock = product.productStock;
    var productQuantity = 1;


    // If stock management on check there is sufficient stock for this product
    if(config.trackStock){
        // Only if not disabled
        if(product.productStockDisable !== true && productStock){
            // If there is more stock than total (ignoring held)
            if(productQuantity > productStock){
                return res.status(400).json({ message: 'There is insufficient stock of this product.' });
            }

            // Aggregate our current stock held from all users carts
            const stockHeld = await db.cart.aggregate([
                { $project: { _id: 0 } },
                { $project: { o: { $objectToArray: '$cart' } } },
                { $unwind: '$o' },
                { $group: {
                    _id: {
                        $ifNull: ['$o.v.variantId', '$o.v.productId']
                    },
                    sumHeld: { $sum: '$o.v.quantity' }
                } }
            ]).toArray();

            // If there is stock
            if(stockHeld.length > 0){
                const heldProduct = _.find(stockHeld, ['_id', getId(productCartId)]);
                if(heldProduct){
                    const netStock = productStock - heldProduct.sumHeld;

                    // Check there is sufficient stock
                    if(productQuantity > netStock){
                        return res.status(400).json({ message: 'There is insufficient stock of this product.' });
                    }
                }
            }
        }
    }

    // if exists we add to the existing value
    let cartQuantity = 0;
    if(req.session.cart[productCartId]){
        
        cartQuantity = parseInt(req.session.cart[productCartId].quantity) + productQuantity;
        req.session.cart[productCartId].quantity = cartQuantity;
        req.session.cart[productCartId].totalItemPrice = productPrice * parseInt(req.session.cart[productCartId].quantity);
    }else{
        // Set the card quantity
        cartQuantity = productQuantity;

        // new product deets
        const productObj = {};
        productObj.productId = product._id;
        productObj.title = product.productTitle;
        productObj.totalItemPrice = productPrice * productQuantity;
        productObj.productDescription = product.productDescription;
        productObj.quantity = productQuantity;
        productObj.productImage = product.productImage;
        
        if(product.productPermalink){
            productObj.link = product.productPermalink;
        }else{
            productObj.link = product._id;
        }

        // merge into the current cart
        req.session.cart[productCartId] = productObj;
    }

    // Update cart to the DB
    await db.cart.updateOne({ sessionId: req.session.id }, {
        $set: { cart: req.session.cart }
    }, { upsert: true });

    // update total cart amount
    await updateTotalCart(req, res);

    // Update checking cart for subscription
    updateSubscriptionCheck(req, res);

    // if(product.productSubscription){
    //     req.session.cartSubscription = product.productSubscription;
    // }

    res.status(200).json({
        message: 'Cart successfully updated',
        cartId: productCartId,
        totalCartItems: req.session.totalCartItems
    });
});
router.post('/product/addreview', async (req, res, next) => {
    const db = req.app.db;

    if(!req.body.stars){
        res.status(400).json({ message: 'Error ! Enter the stars Rating' });
        res.redirect(req.body.link);
        return;
    }
    if(!req.body.productreviewId){
        res.status(400).json({ message: 'Error ! Product Not Found' });
        res.redirect(req.body.link);
        return;
    }
    if(!req.session.customerId){
        res.status(400).json({ message: 'Error ! Login To Continue' });
        res.redirect(req.body.link);
        return;
    }
    const user = await db.customers.findOne({ _id: getId(req.session.customerId)});
    username = user.firstName;
    const reviewItem = {
        title: req.body.reviewTitle,
        rating: req.body.stars,
        username: username,
        date: new Date(),
        description: req.body.reviewtextarea,
        productId: getId(req.body.productreviewId),
        userId: getId(req.session.customerId)
    }

    try{
        const newDoc = await db.reviews.insertOne(reviewItem);
        const product = await db.products.findOne({ _id: getId(req.body.productreviewId)});
        const reviewslist = await db.reviews.find({ productId: getId(product._id) }).toArray();
        var i = 0;
        var totalrating = 0;
        for(i=0;i<reviewslist.length;i++){
            totalrating += parseInt(reviewslist[i].rating);
        }
        totalrating = Math.round(totalrating / reviewslist.length);
        const updatedproduct = await db.products.findOneAndUpdate({_id:product._id},{ $set: {"productRating": totalrating}});
        res.redirect(req.body.link);
    }catch(ex){
        console.log(ex);
        res.status(400).json({ message: 'Error Inserting Reviews. Please try again.' });
    }
});

// Update Review 
router.post('/product/editreview', async (req, res, next) => {
    const db = req.app.db;
    
    if(!req.body.stars){
        res.status(400).json({ message: 'Error ! Enter the stars Rating' });
        res.redirect(req.body.link);
        return;
    }
    if(!req.body.productreviewId){
        res.status(400).json({ message: 'Error ! Product Not Found' });
        res.redirect(req.body.link);
        return;
    }
    if(!req.session.customerId){
        res.status(400).json({ message: 'Error ! Login To Continue' });
        res.redirect(req.body.link);
        return;
    }

    try{
        const updatedreview = await db.reviews.findOneAndUpdate({ productId: getId(req.body.productreviewId), userId: getId(req.session.customerId)},{ $set: {"title": req.body.reviewTitle, "description": req.body.reviewtextarea, "rating": req.body.stars}});
        const reviewslist = await db.reviews.find({ productId: getId(req.body.productreviewId) }).toArray();
        var i = 0;
        var totalrating = 0;
        for(i=0;i<reviewslist.length;i++){
            totalrating += parseInt(reviewslist[i].rating);
        }
        totalrating = Math.round(totalrating / reviewslist.length);
        const updatedproduct = await db.products.findOneAndUpdate({_id: getId(req.body.productreviewId)},{ $set: {"productRating": totalrating}});
        res.redirect(req.body.link);
    }
    catch(ex){
        console.log(ex);
        res.redirect(req.body.link);
    }

});
// search products
router.get('/search/:searchTerm/:pageNum?', (req, res) => {
    const db = req.app.db;
    const searchTerm = req.params.searchTerm;
    const productsIndex = req.app.productsIndex;
    const config = req.app.config;
    const numberProducts = config.productsPerPage ? config.productsPerPage : 6;

    const lunrIdArray = [];
    productsIndex.search(searchTerm).forEach((id) => {
        lunrIdArray.push(getId(id.ref));
    });

    let pageNum = 1;
    if(req.params.pageNum){
        pageNum = req.params.pageNum;
    }

    Promise.all([
        paginateProducts(true, db, pageNum, { _id: { $in: lunrIdArray } }, getSort()),
        getMenu(db)
    ])
    .then(([results, menu]) => {
        // If JSON query param return json instead
        if(req.query.json === 'true'){
            res.status(200).json(results.data);
            return;
        }

        res.render(`${config.themeViews}category`, {
            title: 'Results',
            results: results.data,
            filtered: true,
            session: req.session,
            categories: req.app.categories,
            metaDescription: req.app.config.cartTitle + ' - Search term: ' + searchTerm,
            searchTerm: searchTerm,
            message: clearSessionValue(req.session, 'message'),
            messageType: clearSessionValue(req.session, 'messageType'),
            productsPerPage: numberProducts,
            totalProductCount: results.totalItems,
            pageNum: pageNum,
            paginateUrl: 'search',
            config: config,
            menu: sortMenu(menu),
            helpers: req.handlebars.helpers,
            showFooter: 'showFooter'
        });
    })
    .catch((err) => {
        console.error(colors.red('Error searching for products', err));
    });
});

// search products
router.get('/category/:cat/:pageNum?', (req, res) => {
    const db = req.app.db;
    const searchTerm = req.params.cat;
    const productsIndex = req.app.productsIndex;
    const config = req.app.config;
    const numberProducts = config.productsPerPage ? config.productsPerPage : 6;

    const lunrIdArray = [];
    productsIndex.search(searchTerm).forEach((id) => {
        lunrIdArray.push(getId(id.ref));
    });

    let pageNum = 1;
    if(req.params.pageNum){
        pageNum = req.params.pageNum;
    }

    Promise.all([
        paginateProducts(true, db, pageNum, { _id: { $in: lunrIdArray } }, getSort()),
        getMenu(db)
    ])
        .then(([results, menu]) => {
            const sortedMenu = sortMenu(menu);

            // If JSON query param return json instead
            if(req.query.json === 'true'){
                res.status(200).json(results.data);
                return;
            }

            res.render(`${config.themeViews}category`, {
                title: `Category: ${searchTerm}`,
                results: results.data,
                filtered: true,
                session: req.session,
                searchTerm: searchTerm,
                categories: req.app.categories,
                metaDescription: `${req.app.config.cartTitle} - Category: ${searchTerm}`,
                message: clearSessionValue(req.session, 'message'),
                messageType: clearSessionValue(req.session, 'messageType'),
                productsPerPage: numberProducts,
                totalProductCount: results.totalItems,
                pageNum: pageNum,
                menuLink: _.find(sortedMenu.items, (obj) => { return obj.link === searchTerm; }),
                paginateUrl: 'category',
                config: config,
                menu: sortedMenu,
                helpers: req.handlebars.helpers,
                showFooter: 'showFooter'
            });
        })
        .catch((err) => {
            console.error(colors.red('Error getting products for category', err));
        });
});

// Language setup in cookie
router.get('/lang/:locale', (req, res) => {
    res.cookie('locale', req.params.locale, { maxAge: 900000, httpOnly: true });
    res.redirect('back');
});

// return sitemap
router.get('/sitemap.xml', (req, res, next) => {
    const sm = require('sitemap');
    const config = req.app.config;

    addSitemapProducts(req, res, (err, products) => {
        if(err){
            console.error(colors.red('Error generating sitemap.xml', err));
        }
        const sitemap = sm.createSitemap(
            {
                hostname: config.baseUrl,
                cacheTime: 600000,
                urls: [
                    { url: '/', changefreq: 'weekly', priority: 1.0 }
                ]
            });

        const currentUrls = sitemap.urls;
        const mergedUrls = currentUrls.concat(products);
        sitemap.urls = mergedUrls;
        // render the sitemap
        sitemap.toXML((err, xml) => {
            if(err){
                return res.status(500).end();
            }
            res.header('Content-Type', 'application/xml');
            res.send(xml);
            return true;
        });
    });
});

router.get('/:page?', async (req, res, next) => {
    
    const db = req.app.db;
    const config = req.app.config;
    const numberProducts = config.productsPerPage ? config.productsPerPage : 6;
    var productsIndex = req.app.productsIndex;

    var medicine1 = [];
    productsIndex.search("medicine").forEach((id)=>{
        medicine1.push(getId(id.ref));
    });
    var medicineProduct = await db.products.aggregate([
        {$match: {_id: {$in: medicine1},productStock: {$gt: 0}}},
        {$limit: 4}
    ]).toArray();

    var medicine2 = [];
    productsIndex.search("bnbSpecial").forEach((id)=>{
        medicine2.push(getId(id.ref));
    });
    var medicineProduct2 = await db.products.aggregate([
        {$match: {_id: {$in: medicine2},productStock: {$gt: 0}}},
        {$limit: 4}
    ]).toArray();
    
    console.log(medicineProduct);
    var k = moment().utcOffset('+05:30').format();
   
    // if no page is specified, just render page 1 of the cart
    if(!req.params.page){
        Promise.all([
            paginateProducts(true, db, 1, {}, getSort()),
            getMenu(db)
        ])
            .then(async([results, menu]) => {
                // If JSON query param return json instead
                if(req.query.json === 'true'){
                    res.status(200).json(results.data);
                    return;
                }
            
                res.render(`${config.themeViews}index`, {
                    title: `${config.cartTitle} - Shop`,
                    theme: config.theme,
                    results: results.data,
                    medicineProduct:medicineProduct,
                    medicineProduct2:medicineProduct2,
                    session: req.session,
                    categories: req.app.categories,
                    message: clearSessionValue(req.session, 'message'),
                    messageType: clearSessionValue(req.session, 'messageType'),
                    config,
                    productsPerPage: numberProducts,
                    totalProductCount: results.totalItems,
                    pageNum: 1,
                    paginateUrl: 'page',
                    helpers: req.handlebars.helpers,
                    showFooter: 'showFooter',
                    menu: sortMenu(menu)
                });
            })
            .catch((err) => {
                console.error(colors.red('Error getting products for page', err));
            });
    }else{
        if(req.params.page === 'admin'){
            next();
            return;
        }
        // lets look for a page
        const page = await db.pages.findOne({ pageSlug: req.params.page, pageEnabled: 'true' });
        // if we have a page lets render it, else throw 404
        if(page){
            res.render(`${config.themeViews}page`, {
                title: page.pageName,
                page: page,
                searchTerm: req.params.page,
                session: req.session,
                categories: req.app.categories,
                message: clearSessionValue(req.session, 'message'),
                messageType: clearSessionValue(req.session, 'messageType'),
                config: req.app.config,
                metaDescription: req.app.config.cartTitle + ' - ' + page,
                helpers: req.handlebars.helpers,
                showFooter: 'showFooter',
                menu: sortMenu(await getMenu(db))
            });
        }else{
            res.status(404).render('404', {
                title: '404 Error - Page not found',
                config: req.app.config,
                message: '404 Error - Page not found',
                helpers: req.handlebars.helpers,
                showFooter: 'showFooter',
                menu: sortMenu(await getMenu(db))
            });
        }
    }
});


module.exports = router;
