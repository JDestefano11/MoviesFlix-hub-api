const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const { Movie, User } = require('./models.js');
const passport = require('passport');
const bcrypt = require('bcrypt');
const cors = require('cors');
const { check, validationResult } = require('express-validator');

require('./passport.js');

//mongoose.connect('mongodb://localhost:27017/moviesDB', { useNewUrlParser: true, useUnifiedTopology: true });


const connectionUri = process.env.CONNECTION_URI;

if (!connectionUri) {
    console.error("MongoDB connection string is missing!");
    process.exit(1);
}

mongoose.connect(connectionUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('MongoDB connected...');
}).catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

const app = express();
const port = process.env.PORT || 8080;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(passport.initialize());

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            let message = 'The CORS policy fot this application doesn\'t allow access from the origin ' + origin;
            return callback(new Error(message), false);
        }
        return callback(null, true);
    }
}));

// Define a route handler for the root endpoint
app.get('/', (req, res) => {
    res.send('Hello, World!');
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    // Validate username and password

    const user = await authenticateUser(username, password);
    if (user) {

        const token = generateToken(user);
        res.json({ token });
    } else {
        res.status(401).json({ error: 'Invalid username or password' });
    }
});

// Log out end point 
app.post('/logout', (req, res) => {
    res.status(200).json({ message: 'Logout successful' });
});

// GET: Read list of movies
app.get('/movies', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const movies = await Movie.find();
        res.status(200).json(movies);
    } catch (error) {
        console.error('Error fetching movies:', error);
        res.status(500).send('Error fetching movies');
    }
});

// GET: Read a movie by title
app.get('/movies/:title', passport.authenticate('jwt', { session: false }), async (req, res) => {
    const title = req.params.title;
    try {
        const movie = await Movie.findOne({ Title: title });
        if (!movie) {
            return res.status(404).send({ error: 'Movie not found' });
        }
        res.status(200).json(movie);
    } catch (error) {
        console.error('Error fetching movie:', error);
        res.status(500).send('Error fetching movie');
    }
});

// GET: Read genre by name
app.get('/genres/:name', passport.authenticate('jwt', { session: false }), (req, res) => {
    const name = req.params.name;
    Movie.findOne({ 'Genre.Name': name })
        .then(genre => {
            if (!genre) {
                return res.status(404).send({ error: 'Genre is not found' });
            } else {
                res.status(200).json(genre.Genre);
            }
        })
        .catch(error => {
            console.error('Error fetching genre:', error);
            res.status(500).send('Error fetching genre');
        });
});


// GET: Read director by name
app.get('/directors/:name', passport.authenticate('jwt', { session: false }), async (req, res) => {

    const name = req.params.name;
    Movie.findOne({ 'Director.Name': name })
        .then(director => {
            if (!director) {
                res.status(404).send({ error: 'Director not found' });
            } else {
                res.status(200).json(director.Director);
            }
        })
        .catch(error => {
            console.error('Error fetching director:', error);
            res.status(500).send('Error fetching director');
        });
});

// POST: Allow New Users to Register
app.post('/users', async (req, res) => {
    check('Username', 'Username is required').isLength({ min: 5 }),
        check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
        check('Password', 'Password is required').not().isEmpty(),
        check('Email', 'Email does not appear to be valid').isEmail()


    let errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    try {
        const newUser = req.body;

        // Check if required fields are present
        if (!newUser.Username || !newUser.Password || !newUser.Email) {
            return res.status(400).send('Username and password and email are required');
        }

        // Normalize the username to lowercase
        const normalizedUsername = newUser.Username.toLowerCase();
        const normalizedPassword = newUser.Password.toLowerCase();
        const normalizedEmail = newUser.Email.toLowerCase();

        // Check if the username already exists
        const existingUser = await User.findOne({ $or: [{ Username: normalizedUsername }, { Email: normalizedEmail }] });
        if (existingUser) {
            return res.status(400).send('Username or email already exists');
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(normalizedPassword, 10); // 10 is the salt rounds

        // Create the new user with hashed password
        const user = await User.create({
            Username: normalizedUsername,
            Email: normalizedEmail,
            Password: hashedPassword
        });

        res.status(201).json(user);
    } catch (error) {
        console.error('Error registering new user:', error);
        res.status(500).send('Error registering new user');
    }
});


// PUT: Allow Users to Update Their Username
app.put('/users/:userId', passport.authenticate('jwt', { session: false }), async (req, res) => {
    check('Username')
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 3, max: 20 }).withMessage('Username must be between 3 and 20 characters');

    let errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    try {
        const userId = req.params.userId;
        const updatedInfo = req.body;

        // Find the user by id and update the username
        const userToUpdate = await User.findByIdAndUpdate(userId, { Username: updatedInfo.Username }, { new: true });

        // Check if the user exists
        if (!userToUpdate) {
            return res.status(404).send('User does not exist');
        }

        res.status(200).json(userToUpdate);
    } catch (error) {
        console.error('Error updating username:', error);
        res.status(500).send('Error updating username');
    }
});
// DELETE: Allows users to remove a movie from their favorites
app.delete('/users/:userId/favorites/:movieId', passport.authenticate('jwt', { session: false }), async (req, res) => {

    param('userId').notEmpty().withMessage('User ID is required')
        .isString().withMessage('User ID must be a string')
        .trim()
        .isLength({ min: 1 }).withMessage('User ID must be at least 1 character long'),
        param('movieId').notEmpty().withMessage('Movie ID is required')
            .isString().withMessage('Movie ID must be a string')
            .trim()
            .isLength({ min: 1 }).withMessage('Movie ID must be at least 1 character long')


    let errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }

    const userId = req.params.userId;
    const movieId = req.params.movieId;

    // Check is the Id of the user exists 
    User.findById(userId)
        .then(user => {
            if (!user) {
                res.status(404).send('User does not exist');
            }

            // Check if movie is in the favorites
            const movieIndex = user.FavoriteMovies.indexOf(movieId);
            if (movieIndex === -1) {
                res.status(400).send('Movie is not in the favorites');
            }
            // Remove movie from the users favorites list 
            user.FavoriteMovies.splice(movieIndex, 1);

            return user.save();
        })
        .then(() => {
            res.status(200).send('Movie has been removed from the favorites');
        })
        .catch(error => {
            console.error('Error removing movie from favorites:', error);
            res.status(500).send('Error removing movie from favorites');
        });
});

// Delete a user
app.delete('/users/:id/', passport.authenticate('jwt', { session: false }), (req, res) => {

    check('id').notEmpty().withMessage('User ID is required'),
        check('id').isMongoId().withMessage('User ID must be a valid MongoDB ID')


    let errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }


    const { id } = req.params;

    // Find the user by ID and delete
    User.findByIdAndDelete(id)
        .then((deletedUser) => {
            if (deletedUser) {
                res.status(200).send('User has been deleted');
            } else {
                res.status(404).send('User not found');
            }
        })
        .catch((error) => {
            console.error('Error deleting user:', error);
            res.status(500).send('Error deleting user');
        });
});







app.listen(port, '0.0.0.0', () => {
    console.log('Listening on Port ' + port);
});