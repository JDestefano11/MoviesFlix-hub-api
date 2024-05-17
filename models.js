const mongoose = require('mongoose');

const movieSchema = mongoose.Schema({
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
    ImagePath: { type: String, required: true }
});

// User Schema
const userSchema = mongoose.Schema({
    Username: { type: String, required: true },
    Name: String,
    Password: { type: String, required: true },
    Birthday: Date,
    FavoriteMovies: [String]
});

userSchema.statics.hashPassword = (password) => {
    return bcrypt.hashSync(password, 10);
};

userSchema.methods.validatePassword = function (password) {
    return bcrypt.compareSync(password, this.Password);
};


// Modules
const Movie = mongoose.model('Movie', movieSchema);
const User = mongoose.model('User', userSchema);


// Export modules & schemas
module.exports.Movie = Movie;
module.exports.User = User;




