const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const Models = require('./models.js')



mongoose.connect('mongodb://localhost:27017/moviesDB', { useNewUrlParser: true, useUnifiedTopology: true });


// Import exported entities from model.js
const { Movie, User } = require('./models.js');
const app = express()
const port = 3000

// Middleware to serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse incoming request bodies
app.use(bodyParser.urlencoded({ extended: true }));

const authRoutes = require('./auth.js');
app.use('/auth', authRoutes);
const passport = require('passport');
require('./passport');

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
app.post('/users', passport.authenticate('jwt', { session: false }), (req, res) => {
    const newUser = req.body;

    // Check if required fields are present
    if (newUser.Username) {
        User.findOne({ Username: newUser.Username })
            .then(existingUser => {
                if (existingUser) {
                    res.status(400).send('Username already exists');
                } else {
                    User.create(newUser)
                        .then(user => {
                            res.status(201).json(user);
                        })
                        .catch(error => {
                            console.error('Error registering new user:', error);
                            res.status(500).send('Error registering new user');
                        });
                }
            })
            .catch(error => {
                console.error('Error checking existing user:', error);
                res.status(500).send('Error checking existing user');
            });
    } else {
        res.status(400).send('Username is required');
    }
});

// PUT: Allow Users to Update Their Username
app.put('/users/:userId', passport.authenticate('jwt', { session: false }), async (req, res) => {
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






app.listen(port, () => console.log(`Example app listening on port ${port}!`))

module.exports = app;