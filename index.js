/**
 * @fileoverview Main server file for the MoviesFlix API.
 */

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { passport, generateJWTToken } = require('./passport');
const { Movie, User } = require('./models');
const { check, validationResult } = require('express-validator');

const app = express();
app.use(express.json());

const port = process.env.PORT || 8080;

// Load environment variables
require('dotenv').config();

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

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(passport.initialize());

const allowedOrigins = [
    'http://localhost:1234',
    'https://moviesflix-hub.netlify.app',
    'https://moviesflix-hub-fca46ebf9888.herokuapp.com',
    'http://localhost:4200'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            let message = 'The CORS policy for this application doesn\'t allow access from the origin ' + origin;
            return callback(new Error(message), false);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

/**
 * @description Root endpoint.
 * @name /
 * @function
 * @memberof module:routes
 * @inner
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
app.get('/', (req, res) => {
    res.send('Hello, World!');
});

/**
 * @description Login endpoint.
 * @name /login
 * @function
 * @memberof module:routes
 * @inner
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        const token = generateJWTToken(user.toJSON());

        return res.status(200).json({ user, token });
    } catch (error) {
        console.error('Error during authentication:', error);
        return res.status(500).send('Internal server error');
    }
});

/**
 * @description Logout endpoint.
 * @name /logout
 * @function
 * @memberof module:routes
 * @inner
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
app.post('/logout', (req, res) => {
    res.status(200).json({ message: 'Logout successful' });
});

/**
 * @description Get all movies.
 * @name /movies
 * @function
 * @memberof module:routes
 * @inner
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
app.get('/movies', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        console.log('Authenticated user:', req.user);

        const movies = await Movie.find();
        console.log('Movies found:', movies);

        if (movies.length === 0) {
            return res.status(404).json({ error: 'No movies found' });
        }

        res.status(200).json(movies);
    } catch (error) {
        console.error('Error fetching movies:', error);
        res.status(500).json({ error: 'Error fetching movies' });
    }
});

/**
 * @description Get a movie by title.
 * @name /movies/:title
 * @function
 * @memberof module:routes
 * @inner
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
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

/**
 * @description Get a genre by name.
 * @name /genres/:name
 * @function
 * @memberof module:routes
 * @inner
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
app.get('/genres/:name', passport.authenticate('jwt', { session: false }), (req, res) => {
    const name = req.params.name;
    Movie.findOne({ 'Genre.Name': name })
        .then(genre => {
            if (!genre) {
                return res.status(404).send({ error: 'Genre not found' });
            } else {
                res.status(200).json(genre.Genre);
            }
        })
        .catch(error => {
            console.error('Error fetching genre:', error);
            res.status(500).send('Error fetching genre');
        });
});

/**
 * @description Get a director by name.
 * @name /directors/:name
 * @function
 * @memberof module:routes
 * @inner
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
app.get('/directors/:name', passport.authenticate('jwt', { session: false }), async (req, res) => {
    const name = req.params.name;
    try {
        const director = await Movie.findOne({ 'Director.Name': name });
        if (!director) {
            return res.status(404).send({ error: 'Director not found' });
        }
        res.status(200).json(director.Director);
    } catch (error) {
        console.error('Error fetching director:', error);
        res.status(500).send('Error fetching director');
    }
});

/**
 * @description Register a new user.
 * @name /users
 * @function
 * @memberof module:routes
 * @inner
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
app.post('/users', async (req, res) => {
    try {
        const { username, password, email, birthday } = req.body;

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ username, password: hashedPassword, email, birthday });
        const savedUser = await newUser.save();

        res.status(201).json(savedUser);
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Error registering user' });
    }
});

/**
 * @description Update a user's username.
 * @name /users/:username/update-username
 * @function
 * @memberof module:routes
 * @inner
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
app.put('/users/:username/update-username',
    passport.authenticate('jwt', { session: false }),
    [
        check('newUsername', 'New username is required').isLength({ min: 5 }),
        check('newUsername', 'New username contains non-alphanumeric characters - not allowed.').isAlphanumeric()
    ],
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        const { newUsername } = req.body;

        User.findOneAndUpdate(
            { username: req.params.username },
            { $set: { username: newUsername } },
            { new: true }
        )
            .then((updatedUser) => {
                if (!updatedUser) {
                    return res.status(404).json({ error: "User was not found" });
                }
                res.json({ user: updatedUser });
            })
            .catch((err) => {
                console.error('Error updating username:', err);
                res.status(500).json({
                    error: "Internal server error",
                    message: "Failed to update username"
                });
            });
    }
);

/**
 * @description Delete a user account.
 * @name /users/:username
 * @function
 * @memberof module:routes
 * @inner
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
app.delete("/users/:username",
    passport.authenticate("jwt", { session: false }),
    (req, res) => {
        const username = req.params.username;

        if (!username) {
            return res.status(400).json({ error: "Username parameter is missing or invalid" });
        }

        User.findOneAndDelete({ username })
            .then((user) => {
                if (!user) {
                    return res.status(404).json({ error: `User ${username} was not found` });
                }
                res.json({ message: `${username} was deleted.` });
            })
            .catch((err) => {
                console.error('Error deleting user:', err);
                res.status(500).json({
                    error: "Internal Server Error",
                    message: "Failed to delete the specified user",
                });
            });
    });

/**
 * @description Add a movie to a user's list of favorites.
 * @name /users/:username/favorites/:movieId
 * @function
 * @memberof module:routes
 * @inner
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
app.post('/users/:username/favorites/:movieId', passport.authenticate('jwt', { session: false }), async (req, res) => {
    const { username, movieId } = req.params;
    try {
        const user = await User.findOneAndUpdate(
            { username },
            { $addToSet: { favoriteMovies: movieId } },
            { new: true }
        ).populate('favoriteMovies');
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error adding movie to favorites', error });
    }
});

/**
 * @description Remove a movie from a user's list of favorites.
 * @name /users/:username/favorites/:movieId
 * @function
 * @memberof module:routes
 * @inner
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
app.delete('/users/:username/favorites/:movieId', passport.authenticate('jwt', { session: false }), async (req, res) => {
    const { username, movieId } = req.params;
    try {
        const user = await User.findOneAndUpdate(
            { username },
            { $pull: { favoriteMovies: movieId } },
            { new: true }
        ).populate('favoriteMovies');
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error removing movie from favorites', error });
    }
});

/**
 * @description Get the movie of the day.
 * @name /movie-of-the-day
 * @function
 * @memberof module:routes
 * @inner
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
app.get('/movie-of-the-day', passport.authenticate('jwt', { session: false }), (req, res) => {
    Movie.find()
        .then(movies => {
            if (movies.length > 0) {
                const randomIndex = Math.floor(Math.random() * movies.length);
                const movieOfTheDay = movies[randomIndex];
                res.json(movieOfTheDay);
            } else {
                res.status(404).send('No movies found');
            }
        })
        .catch(err => {
            console.error('Error getting movie of the day:', err);
            res.status(500).send('Something went wrong');
        });
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
