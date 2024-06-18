const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const JWTStrategy = require('passport-jwt').Strategy;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { ExtractJwt } = require('passport-jwt');
const { User } = require('./models'); // Adjust path as per your project structure

// Load environment variables
require('dotenv').config();

// Use a secure JWT secret from environment variables or generate securely
const JWT_SECRET = process.env.JWT_SECRET || 'defaultsecret'; // Replace 'defaultsecret' with your actual secret

const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: JWT_SECRET
};

// Local Strategy for username and password authentication
passport.use(new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password'
}, async (username, password, done) => {
    try {
        // Find user by username (case-insensitive)
        const user = await User.findOne({ username: new RegExp('^' + username + '$', 'i') });
        if (!user) {
            return done(null, false, { message: 'Incorrect username.' });
        }

        // Compare passwords with bcrypt
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return done(null, false, { message: 'Incorrect password.' });
        }

        return done(null, user);
    } catch (error) {
        return done(error);
    }
}));

// JWT Strategy for token authentication
passport.use(new JWTStrategy(opts, async (jwt_payload, done) => {
    try {
        const user = await User.findById(jwt_payload.userId);
        if (user) {
            return done(null, user);
        } else {
            return done(null, false);
        }
    } catch (error) {
        return done(error, false);
    }
}));

// Function to generate JWT token
const generateJWTToken = (user) => {
    return jwt.sign({ userId: user._id }, JWT_SECRET, {
        expiresIn: '1d' // Token expires in 1 day
    });
};

module.exports = { passport, generateJWTToken };
