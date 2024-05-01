const jwtSecret = 'YourSecretKeyHere'

const jwt = require('jsonwebtoken'),
    passport = require('passport')

require('./passport'); // Your local passport file



const generateJWTToken = (user) => {
    return jwt.sign(user, jwtSecret, {
        subject: user.Username, // Username encoded in the JWT
        expiresIn: '7d', // Token expires in 7 days
        algorithm: 'HS256' // Algorithm used to encode the JWT
    });
}

router.post('/login', (req, res,) => {
    passport.authenticate('local', { session: false }, (error, user, info) => {
        if (error || !user) {
            return res.status(400).json({
                message: 'Something is not right',
                user: user
            });
        }
        req.login(user, { session: false }, (error) => {
            if (error) {
                return next(error);
            }
            const token = generateJWTToken({ _id: user._id });
            return res.json({ user, token });
        });
    })(req, res, next);
});

module.exports = router;

