const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const passportJWT = require('passport-jwt');
const Models = require('./models.js');




const User = Models.User;
const ExtractJWT = passportJWT.ExtractJwt;
const JWTStrategy = passportJWT.Strategy;


passport.use(
    new LocalStrategy(
        {
            usernameField: 'Username',
            passwordField: 'Password',
        },
        async (username, password, callback) => {
            try {
                const user = await User.findOne({ Username: username });
                if (!user || !user.validatePassword(password)) {
                    return callback(null, false, { message: 'Incorrect username or password' });
                }
                return callback(null, user);
            } catch (error) {
                return callback(error);
            }
        }
    )
);
passport.use(
    new JWTStrategy(
        {
            jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
            secretOrKey: 'YourSecretKeyHere',
        },
        async (jwtPayload, callback) => {
            try {
                const user = await User.findById(jwtPayload._id);
                if (!user) {
                    return callback(null, false);
                }
                return callback(null, user);
            } catch (error) {
                return callback(error);
            }
        }
    )
);
