const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();

router.post('/login', (req, res, next) => {
    passport.authenticate('local', { session: false }, (error, user, info) => {
        if (error || !user) {
            return res.status(400).json({ message: 'Incorrect username or password' });
        }
        req.login(user, { session: false }, (error) => {
            if (error) {
                return next(error);
            }
            const token = jwt.sign({ _id: user._id }, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', { expiresIn: '7d' }); // Replace with your JWT secret
            return res.json({ user, token });
        });
    })(req, res, next);
});

module.exports = router;
