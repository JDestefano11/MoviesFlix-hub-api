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
app.put('/users/:username', passport.authenticate('jwt', { session: false }), async (req, res) => {
    const { username } = req.params;
    const { newUsername } = req.body;

    try {
        const userToUpdate = await Users.findOneAndUpdate(
            { username },
            { username: newUsername },
            { new: true }
        );

        if (!userToUpdate) {
            return res.status(404).send('User does not exist');
        }

        res.status(200).json(userToUpdate);
    } catch (error) {
        console.error('Error updating username:', error);
        res.status(500).send('Error updating username');
    }
});

// app.put('/users/:userId', passport.authenticate('jwt', { session: false }), async (req, res) => {
//     const { userId } = req.params;
//     const { Username } = req.body;

//     try {
//         const userToUpdate = await User.findByIdAndUpdate(userId, { Username }, { new: true });

//         if (!userToUpdate) {
//             return res.status(404).send('User does not exist');
//         }

//         res.status(200).json(userToUpdate);
//     } catch (error) {
//         console.error('Error updating username:', error);
//         res.status(500).send('Error updating username');
//     }
// });

// DELETE: Delete user account
app.delete('/users/:username', passport.authenticate('jwt', { session: false }), async (req, res) => {
    const { username } = req.params;

    try {
        const deletedUser = await Users.findOneAndDelete({ username });
        if (!deletedUser) {
            return res.status(404).send('User does not exist');
        }

        res.status(200).json({ message: 'User successfully deleted' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).send('Error deleting user');
    }
});


// // DELETE: Delete user account
// app.delete('/users/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
//     const { id } = req.params;

//     try {
//         const deletedUser = await User.findByIdAndDelete(id);
//         if (!deletedUser) {
//             return res.status(404).send('User does not exist');
//         }

//         res.status(200).json({ message: 'User successfully deleted' });
//     } catch (error) {
//         console.error('Error deleting user:', error);
//         res.status(500).send('Error deleting user');
//     }
// });

app.post('/users/:username/movies/:movieId', passport.authenticate('jwt', { session: false }), async (req, res) => {
    console.log('Received request to add movie to favorites');
    await User.findOneAndUpdate(
        { username: req.params.username },
        {
            $push: { favoriteMovies: req.params.movieId }
        },
        { new: true }
    )
        .then((updatedUser) => {
            res.json(updatedUser);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json({
                error: "Internal Server Error",
                message: "Failed to add the specified movie"
            });
        });
});

// app.post('/users/:userId/favorites', passport.authenticate('jwt', { session: false }), async (req, res) => {
//     const { userId } = req.params;
//     const { movieId } = req.body;

//     try {
//         const user = await User.findById(userId);
//         if (!user) {
//             2return res.status(404).send('User not found');
//         }

//         if (user.favoriteMovies.includes(movieId)) {
//             return res.status(400).send('Movie already in favorites');
//         }

//         user.favoriteMovies.push(movieId);
//         await user.save();

//         res.status(200).send('Movie added to favorites');
//     } catch (error) {
//         console.error('Error adding movie to favorites:', error);
//         res.status(500).send('Error adding movie to favorites');
//     }
// });
// DELETE: Remove movie from user's favorites
app.delete('/users/:username/movies/:movieId', passport.authenticate('jwt', { session: false }), async (req, res) => {
    await Users.findOneAndUpdate(
        { username: req.params.username },
        {
            $pull: { favoriteMovies: req.params.movieId }
        },
        { new: true }
    )
        .then((updatedUser) => {
            if (!updatedUser) {
                return res.status(404).send('User not found');
            }
            res.json(updatedUser);
        })
        .catch((err) => {
            console.error('Error removing movie from favorites:', err);
            res.status(500).json({
                error: "Internal Server Error",
                message: "Failed to remove the specified movie"
            });
        });
});


// // DELETE: Remove movie from user's favorites
// app.delete('/users/:userId/favorites/:movieId', passport.authenticate('jwt', { session: false }), async (req, res) => {
//     const { userId, movieId } = req.params;

//     try {
//         const user = await User.findById(userId);
//         if (!user) {
//             return res.status(404).send('User not found');
//         }

//         const movieIndex = user.favoriteMovies.indexOf(movieId);
//         if (movieIndex === -1) {
//             return res.status(400).send('Movie is not in favorites');
//         }

//         user.favoriteMovies.splice(movieIndex, 1);
//         await user.save();

//         res.status(200).send('Movie removed from favorites');
//     } catch (error) {
//         console.error('Error removing movie from favorites:', error);
//         res.status(500).send('Error removing movie from favorites');
//     }
// });




































































// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});