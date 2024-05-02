const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { User } = require('./models.js');
const jwtSecret = 'ThisIsATemporarySecretKey123'



const router = express.Router();

router.post('/login', passport.authenticate('local', { session: false }), (req, res) => {
    const { _id, username } = req.user;
    const token = jwt.sign({ id: _id, username }, jwtSecret);
    res.json({ token, username }); // Include username in the response
});

module.exports = router;


