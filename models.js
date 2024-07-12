const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    birthday: { type: Date, required: true },
    favoriteMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Movie" }]
});

const movieSchema = new mongoose.Schema({
    Title: { type: String, required: true },
    Description: { type: String, required: true },
    Year: Number,
    Rating: { type: Number, default: 0 },
    Genre: {
        Name: { type: String, required: true },
        Description: { type: String }
    },
    Director: {
        Name: { type: String, required: true },
        Occupation: { type: String },
        BirthDate: { type: Date },
        BirthPlace: { type: String }
    },
    ImageUrl: { type: String },
});




const User = mongoose.model('User', userSchema);
const Movie = mongoose.model('Movie', movieSchema);

module.exports = { User, Movie };