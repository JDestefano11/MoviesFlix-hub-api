const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const JWTStrategy = require('passport-jwt').Strategy;
const bcrypt = require('bcryptjs');
const { ExtractJwt } = require('passport-jwt');
const { User } = require('./models.js');
const { v4: uuidv4 } = require('uuid');

// Generate a random secret key (UUID)
const JWT_SECRET = uuidv4();

const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: JWT_SECRET
};

// Local Strategy for basic HTTP authentication
passport.use(new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true
},
    async (req, username, password, done) => {
        try {
            console.log('Username:', username, 'Password:', password);
            username = username || req.body.username;
            password = password || req.body.password;
            console.log('Updated Username:', username, 'Updated Password:', password);

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
    }
));

// JWT Strategy for token authentication
passport.use(new JWTStrategy(opts,
    async (jwt_payload, done) => {
        try {
            const user = await
                User.findById(jwt_payload.userId);
            if (user) {
                return done(null, user);
            }
            else {
                return done(null, false);
            }
        } catch (error) {
            return done(error, false);
        }
    }));





module.exports = { passport, JWT_SECRET };
