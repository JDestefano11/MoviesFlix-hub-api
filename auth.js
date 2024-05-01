const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('./models.js');
const jwtSecret = 'ThisIsATemporarySecretKey123'



const router = express.Router();

router.post('/login', passport.authenticate('local', { session: false }), (req, res) => {
    const token = jwt.sign({ id: req.user._id }, jwtSecret);
    res.json({ token });
});

module.exports = router;




