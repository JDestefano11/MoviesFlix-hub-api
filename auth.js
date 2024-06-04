const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { User } = require('./models.js');
const jwtSecret = require('crypto').randomBytes(32).toString('hex');


const router = express.Router();

router.post('/login', passport.authenticate('local', { session: false }), (req, res) => {
    const { _id, username } = req.user;
    const token = jwt.sign({ id: _id, username }, jwtSecret);
    res.json({ token, username });
});

module.exports = router;
