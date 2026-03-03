const express = require('express');
const passport = require('passport');
const SamlStrategy = require('passport-saml').Strategy;
const fs = require('fs');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');

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
// Configure Handlebars with helpers

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public/views')); // Make sure this points to your views directory

// Serve static frontend
app.use(express.static('public'));

// Load SAML config
const samlConfig = {
    entryPoint: process.env.OKTA_ENTRYPOINT, // From Okta metadata
    issuer: process.env.OKTA_ISSUER, // From Okta metadata
    callbackUrl: process.env.OKTA_ISSUER, // Updated to match your route
    cert: fs.readFileSync(__dirname + "/saml.pem", "utf8"), // Load Okta cert
};

// Configure Passport-SAML
passport.use(new SamlStrategy(samlConfig, (profile, done) => {
   // console.log("SAML Profile:", profile);
    return done(null, profile);
}));

passport.serializeUser((user, done) => {
    done(null, user);
});
passport.deserializeUser((user, done) => {
    done(null, user);
});

// Home route
app.get('/', (req, res) => {
    res.render('login'); // Assuming you have a login.handlebars in your views folder
});

// 🔹 SAML Authentication Routes
app.get('/auth/saml', passport.authenticate('saml', { failureRedirect: '/' }));

app.post('/login/callback',
    passport.authenticate('saml', { failureRedirect: '/' }),
    (req, res) => {
        console.log("=== SAML Callback - Full User Object ===");
        console.log(JSON.stringify(req.user, null, 2));

        if (!req.user) return res.redirect('/auth/saml');

        // Format user data for display
        const userData = {};
        const userEntitlements = {};
        // Add basic user info
        userData.email = req.user.nameID;
        userData.firstName = req.user.firstName;
        userData.lastName = req.user.lastName;

        const skipAttributes = process.env.SKIP_ATTRIBUTES ? process.env.SKIP_ATTRIBUTES.split(',') : [];

        console.log("=== Checking for Role & Access Attributes ===");
        if (req.user.attributes) {
            Object.keys(req.user.attributes).forEach(key => {
                if (key.toLowerCase().includes('role') || key.toLowerCase().includes('access')) {
                    console.log(`${key}:`, req.user.attributes[key]);
                }
            });
        }
        
        // Process attributes
        if (req.user.attributes) {
            Object.entries(req.user.attributes).forEach(([key, value]) => {
                // Skip firstName and lastName
                if (!skipAttributes.includes(key)) {
                    if (Array.isArray(value) && value.length === 1) {
                        // Simplify single-item arrays
                        userEntitlements[key] = value[0];
                    } else if (Array.isArray(value)) {
                        // Flatten nested arrays
                        userEntitlements[key] = value.flat();
                    } else {
                        // Wrap single strings in an array
                        userEntitlements[key] = [value];
                    }
                }
            });
        }
        console.log(userEntitlements)
        // Debug output          
        // Render the dashboard with formatted data
        res.render('dashboard', { 
            user: userData,
            entitlements: userEntitlements,
        });
    }
);

// Dashboard route with authentication check
app.get('/dashboard', ensureAuthenticated, (req, res) => {
    const userAttributes = {};
    if (req.user && req.user.attributes) {
        Object.entries(req.user.attributes).forEach(([key, value]) => {
            userAttributes[key] = value;
        });
    }
    
    res.render('dashboard', { 
        user: req.user,
        attributes: userAttributes
    });
});

// Middleware to check if user is authenticated
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}

// 🔹 Logout Route
app.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/');
    });
});

app.listen(1337, () => console.log('Server running on http://localhost:1337'));