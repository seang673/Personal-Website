const express = require('express');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

//creates instance of Express app, to define routes and middleware
const app = express();

//applies cookie-parser to the application
app.use(cookieParser());

app.get('/', (req, res) => {
    res.cookie('myCookie', 'cookieValue', {
        httpOnly: true,
        secure: true,
        maxAge: 3600000,   //set cookie's expiration time to one hour 

    });
    res.send('The cookie has been sent');
});

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // Sets time window to 10 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 10 minutes',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply the rate limiter to all requests
app.use(limiter);


app.listen(3000, () => {
  console.log('Server is running on port 3000');
});