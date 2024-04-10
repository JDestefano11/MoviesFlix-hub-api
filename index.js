const express = require('express');
const morgan = require('morgan');
const path = require('path');


const app = express();
const port = 5000;

// Middleware to log all requests
app.use(morgan('common'));

// Middleware to serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Get route for /movies
app.get('/movies', (req, res) => {

    const topMovies = [
        { title: 'Movie 1', year: 2022 },
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


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});