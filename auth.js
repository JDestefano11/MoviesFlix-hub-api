const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { User } = require('./models.js');
const jwtSecret = require('crypto').randomBytes(32).toString('hex');



// Define a constants for jwt secret
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_here';

// Define a function to generate token
const generateToken = ({ _id, username }) => jwt.sign({ id: _id, username }, JWT_SECRET);

router.post('/login', passport.authenticate('local', { session: false }), (req, res, next) => {
    try {
        const { _id, username } = req.user;
        const token = generateToken({ _id, username });
        res.json({ token, username }); // Include username in the response
    } catch (err) {
        next(err); // Handle any errors
    }
});

module.exports = router;

