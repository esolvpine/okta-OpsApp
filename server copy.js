const express = require('express');
const passport = require('passport');
const SamlStrategy = require('passport-saml').Strategy;
const fs = require('fs');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const exphbs = require('express-handlebars'); // Import Handlebars
require('dotenv').config();

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// 🔹 Required for Passport-SAML to work
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

// 🔹 Configure Handlebars
app.engine('handlebars', exphbs.engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, '/views'));


// Serve static frontend
app.use(express.static('public'));

// Load SAML config
const samlConfig = {
    entryPoint: process.env.OKTA_ENTRYPOINT, // From Okta metadata
    issuer: process.env.OKTA_ISSUER, // From Okta metadata
    callbackUrl: "https://samlvalidator.esolv.ca/auth/saml/callback",
    cert: fs.readFileSync(__dirname + "/saml.pem", "utf8"), // Load Okta cert
};

// Configure Passport-SAML
passport.use(new SamlStrategy(samlConfig, (profile, done) => {
    console.log("SAML Profile:", profile);
    return done(null, profile);
}));

passport.serializeUser((user, done) => {
    done(null, user);
});
passport.deserializeUser((user, done) => {
    done(null, user);
});

// 🔹 SAML Authentication Routes
app.get('/auth/saml', passport.authenticate('saml', { failureRedirect: '/' }));

app.post('/login/callback',
    passport.authenticate('saml', { failureRedirect: '/' }),
    (req, res) => {
        // Log all attributes from the SAML response
        if (req.user && req.user.entitlements) {
           // console.log("SAML Attributes:");
            Object.entries(req.user.entitlements).forEach(([key, value]) => {
                console.log(`${key}: ${value}`);
            });
        } else {
            console.log("No attributes found in SAML response.");
        }

        // Decode and log the raw SAML XML
        const samlXML = Buffer.from(req.body.SAMLResponse, 'base64').toString();
      //  console.log("Decoded SAML Assertion:", samlXML); // Human-readable XML


        if (!req.user) return res.redirect('/auth/saml');
        // Dynamically collect all attributes from req.user
        const userAttributes = {};
        Object.entries(req.user.attributes).forEach(([key, value]) => {
            userAttributes[key] = value;
        });

       // Redirect user after login
        res.redirect('../public/dashboard.handlebars');
    }
);

// 🔹 Logout Route
app.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/');
    });
});

app.listen(1337, () => console.log('Server running on http://localhost:1337'));
