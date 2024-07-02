const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { passport, generateJWTToken } = require('./passport');
const { Movie, User } = require('./models'); // Adjust path as per your project structure
const { check, validationResult } = require('express-validator');

const app = express();
const port = process.env.PORT || 8080;

// Load environment variables
require('dotenv').config();


//mongoose.connect('mongodb+srv://destefanoj380:JCodes11!@cluster0.ww6knul.mongodb.net/', { useNewUrlParser: true, useUnifiedTopology: true });


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

const allowedOrigins = ['http://localhost:1234', 'https://moviesflix-hub-fca46ebf9888.herokuapp.com'];

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
    console.log(`Received login request for username: ${username}`);

    try {
        const user = await User.findOne({ username });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        const token = generateJWTToken(user.toJSON());
        return res.status(200).json({ message: 'Login successful', token });
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

// PUT: Update user's username
app.put('/users/:userId', passport.authenticate('jwt', { session: false }), async (req, res) => {
    const { userId } = req.params;
    const { Username } = req.body;

    try {
        const userToUpdate = await User.findByIdAndUpdate(userId, { Username }, { new: true });

        if (!userToUpdate) {
            return res.status(404).send('User does not exist');
        }

        res.status(200).json(userToUpdate);
    } catch (error) {
        console.error('Error updating username:', error);
        res.status(500).send('Error updating username');
    }
});

// DELETE: Remove movie from user's favorites
app.delete('/users/:userId/favorite/:movieId', passport.authenticate('jwt', { session: false }), async (req, res) => {
    const { userId, movieId } = req.params;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }

        const movieIndex = user.FavoriteMovies.indexOf(movieId);
        if (movieIndex === -1) {
            return res.status(400).send('Movie is not in favorites');
        }

        user.FavoriteMovies.splice(movieIndex, 1);
        await user.save();

        res.status(200).send('Movie removed from favorites');
    } catch (error) {
        console.error('Error removing movie from favorites:', error);
        res.status(500).send('Error removing movie from favorites');
    }
});

// DELETE: Delete user account
app.delete('/users/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
    const { id } = req.params;

    try {
        const deletedUser = await User.findByIdAndDelete(id);
        if (!deletedUser) {
            return res.status(404).send('User not found');
        }

        res.status(200).send('User deleted');
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).send('Error deleting user');
    }
});










app.put('/users/:userId/favorites', passport.authenticate('jwt', { session: false }), async (req, res) => {
    const userId = req.params.userId;
    const { movieId, isFavorite } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Ensure only the authenticated user can update their favorites
        if (req.user._id.toString() !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        if (isFavorite) {
            user.FavoriteMovies.push(movieId);
        } else {
            user.FavoriteMovies = user.FavoriteMovies.filter(id => id !== movieId);
        }

        await user.save();
        res.json(user);
    } catch (error) {
        console.error('Error updating favorite movies:', error);
        res.status(500).json({ error: 'Failed to update favorite movies' });
    }
});






// Start server
app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${port}`);
});