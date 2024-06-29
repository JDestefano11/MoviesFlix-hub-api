const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const movieSchema = mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, required: true },
    Title: { type: String, required: true },
    Description: { type: String, required: true },
    Genre: {
        Name: String,
        Description: String
    },
    Director: {
        Name: String,
        Occupation: String,
        BirthDate: Date,
        BirthPlace: String,
        Bio: String
    },
    ImageUrl: String
});

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    name: String,
    email: { type: String, required: true },
    password: { type: String, required: true },
    birthday: Date,
    FavoriteMovies: [String]
});

userSchema.statics.hashPassword = (password) => {
    return bcrypt.hashSync(password, 10);
};

userSchema.methods.validatePassword = function (password) {
    return bcrypt.compareSync(password, this.password);
};

// Modules
const Movie = mongoose.model('Movie', movieSchema);
const User = mongoose.model('User', userSchema);

// Export modules & schemas
module.exports.Movie = Movie;
module.exports.User = User;