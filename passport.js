const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const Models = require('./models.js')
const passportJWT = require('passport-jwt')

let Users = Models.User,
    JWTStrategy = passportJWT.Strategy,
    ExtractJWT = passportJWT.ExtractJwt;

passport.use(
    new LocalStrategy(
        {
            usernameField: 'Username',
            passwordField: 'Password',
        },
        async (username, password, callback) => {
            console.log(`${username} ${password}`);
            await Users.findOne({ Username: username })
                .then((user) => {
                    if (!user) {
                        console.log('incorrect username');
                        return callback(null, false, {
                            message: 'Incorrect username or password.',
                        });
                    }
                    console.log('finished');
                    return callback(null, user);
                })
                .catch((error) => {
                    if (error) {
                        console.log(error);
                        return callback(error);
                    }
                })
        }
    )
);


// Configure Passport to use JWT authentication strategy
passport.use(new JWTStrategy({
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
}, async (jwtPayload, callback) => {
    try {
        // Find the user associated with the ID extracted from the JWT payload
        const user = await Users.findById(jwtPayload._id);
        // Return the user if found
        return callback(null, user);
    } catch (error) {
        // Return any error that occurs during the process
        return callback(error);
    }
}));
module.exports = passport;