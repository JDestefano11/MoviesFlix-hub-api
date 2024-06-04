const passport = require('passport');
const jwt = require('jsonwebtoken');
const jwtSecret = require('crypto').randomBytes(32).toString('hex');
const express = require('express');
const router = express.Router();

// Define the login route
router.post('/login', passport.authenticate('local', { session: false }), async (req, res) => {
    try {
        const { _id, username } = req.user;
        const token = jwt.sign({ id: _id, username }, process.env.JWT_SECRET);
        res.json({ token, username });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router; // Export the router
