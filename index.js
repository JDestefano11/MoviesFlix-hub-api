const express = require('express')
const morgan = require('morgan')
const path = require('path')
const uuid = require('uuid')
const bodyParser = require('body-parser')
const mongoose = require('mongoose');
const Models = require('./models.js');
const Movie = Models.Movie;
const User = Models.User;

mongoose.connect('mongodb://localhost:27017/moviesDB', { useNewUrlParser: true, useUnifiedTopology: true });


// Import exported entities from model.js
const { Movie, User } = require('./model.js');

// Your code here


const app = express()
const port = 3000


// Initialize users array
const users = [
    {
        id: '1',
        favorites: []
    }
];

// Middleware to log all requests
app.use(morgan('common'));

// Middleware to serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Allow bodyParser to be used
app.use(bodyParser.json());

// Get route for /movies
app.get('/movies', (req, res) => {

    const topMovies = [
        { title: 'Avengers', year: 2022 },
        { title: 'Movie 2', year: 2020 },
        { title: 'Movie 3', year: 2021 },
        { title: 'Movie 4', year: 2018 },
        { title: 'Movie 5', year: 2023 },
        { title: 'Movie 6', year: 2016 },
        { title: 'Movie 7', year: 2012 },
        { title: 'Movie 8', year: 2024 },
        { title: 'Movie 9', year: 2010 },
        { title: 'Movie 10', year: 2015 },

    ];

    res.json(topMovies);
});

// Get route for something random 
app.get('/', (req, res) => {
    res.send('Welcome to my movie app');
});

// Middleware for catching errors
app.use(function (err, req, res, next) {
    console.error(err.stack)
    res.status(500).send('Something broke!')
});

// GET: Read list of movies
app.get('/movies', (req, res) => {
    res.status(200).json(movies);
});

// GET: Read a movie by title

app.get('/movies/:title', (req, res) => {

    const title = req.params.title;
    const movie = movies.find(movie => movie.title === title);

    if (!movie) {
        return res.status(404).send({ error: 'Movie is not found' });
    }

    res.status(200).json(movie);
});

// GET: Read genre by name
app.get('/genres/:name', (req, res) => {

    const name = req.params.name;
    const genre = genres.find(genre => genre.name === name);

    if (!genre) {
        return res.status(404).send({ error: 'Genre is not found' });
    }

    res.status(200).json(genre);
});



// GET: Read director by name
app.get('/directors/:name', (req, res) => {

    const name = req.params.name;
    const director = directors.find(director => director.name === name);

    if (!director) {
        return res.status(404).send('Director not found');
    }

    res.status(200).json(director);
});

// POST: Allow New Users to Register
app.post('/users', (req, res) => {

    const newUser = req.body;


    // Check if the user's fullname is provided
    if (newUser.fullname && newUser.email && newUser.username) {
        newUser.id = uuid.v4();
        users.push(newUser);
        console.log('New User Registered:', newUser);
        res.status(201).json(newUser);
    } else {
        console.log('Registration Failed: Missing Fields');
        res.status(400).send('New user information is incomplete');
    }
});

// PUT: Allow Users to Update Their Username
app.put('/users/:userId', (req, res) => {

    const userId = req.params.userId;
    const updatedInfo = req.body;

    // Find the user by id
    const userToUpdate = users.find(user => user.id === userId);

    // Check if the user exists
    if (!userToUpdate) {
        return res.status(404).send('User does not exist');
    }

    // Update the username if it is provided in the request body
    if (updatedInfo.username) {
        userToUpdate.username = updatedInfo.username;
        res.status(200).json(userToUpdate);
    } else {
        return res.status(400).send('New username is required');
    }
});

// POST: Allow a User to Add a Movie to Their Favorites 
app.post('/users/:userId/favorites', (req, res) => {
    const userId = req.params.userId;
    const movieId = req.body.movieId;

    // Find user by Id
    const user = users.find(user => user.id === userId);

    // See if the user exists
    if (!user) {
        return res.status(404).send('User does not exist');
    }

    // Check if movie Id is provided
    if (!movieId) {
        return res.status(400).send('Movie is required');
    }

    // Check if the movie is already in favorites
    if (user.favorites.includes(movieId)) {
        return res.status(400).send('Movie is already in favorites');
    }

    // Add new movie to the user's favorites list
    user.favorites.push(movieId);

    res.status(200).send('Movie has been added to favorites');
});

// DELETE: Allow Users to Remove a Movie from Their Favorites
app.delete('/users/:userId/favorites/:movieId', (req, res) => {
    const userId = req.params.userId;
    const movieId = req.params.movieId;

    // Find the user by ID
    const user = users.find(user => user.id === userId);

    // Check if the user exists
    if (!user) {
        return res.status(404).send('User does not exist');
    }

    // Check if the movie is in the user's favorites list
    const movieIndex = user.favorites.indexOf(movieId);
    if (movieIndex === -1) {
        return res.status(400).send('Movie is not in favorites');
    }

    // Remove the movie from the user's favorites list
    user.favorites.splice(movieIndex, 1);

    res.status(200).send('Movie has been removed from favorites');
});

// Delete a user
app.delete('/users/:id/', (req, res) => {
    // Extract the user ID from the request parameters
    const { id } = req.params;

    // Find the index of the user in the users array
    const userIndex = users.findIndex(user => user.id == id);

    // Check if the user exists
    if (userIndex !== -1) {
        // Remove the user from the users array
        users.splice(userIndex, 1);
        // Log the updated users array
        console.log(users);
        // Send a success response
        res.status(200).send('User has been deleted');
    } else {
        // Send a 404 response if the user is not found
        res.status(404).send('User not found');
    }
});





















































app.listen(port, () => console.log(`Example app listening on port ${port}!`))