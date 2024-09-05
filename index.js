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

const allowedOrigins = ['http://localhost:1234', 'https://moviesflix-hub.netlify.app',
    'https://moviesflix-hub-fca46ebf9888.herokuapp.com/',
    'http://localhost:4200/'];

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

// Define a route handler for the root endpoint
app.get('/', (req, res) => {
    res.send('Hello, World!');
});

// Login endpoint
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Find user by username
        const user = await User.findOne({ username });

        // Check if user exists and password is correct
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        // Generate JWT token
        const token = generateJWTToken(user.toJSON());

        // Return user and token upon successful login
        return res.status(200).json({ user, token });
    } catch (error) {
        console.error('Error during authentication:', error);
        return res.status(500).send('Internal server error');
    }
});

// Logout endpoint
app.post('/logout', (req, res) => {
    res.status(200).json({ message: 'Logout successful' });
});

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

// GET: Read director by name
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

// POST: Register new users
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
// PUT: Update username
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

// Deletes a user account
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

// Add favorite movie to movies list
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

// Delete movie from favorites list
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

// Endpoint for getting movie of the day
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