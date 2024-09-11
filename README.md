# MoviesFlix-hub-api

MoviesFlix-hub-api is the server-side component of a movies web application. It provides a RESTful API for managing users, movies, genres, and directors. The API is built using Node.js, Express, and MongoDB.

## Table of Contents

- [MoviesFlix-hub-api](#moviesflix-hub-api)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Installation](#installation)
  - [Usage](#usage)
  - [API Endpoints](#api-endpoints)
    - [Movies](#movies)
    - [Genres](#genres)
    - [Directors](#directors)
    - [Users](#users)
  - [Authentication](#authentication)
  - [Environment Variables](#environment-variables)
  - [Documentation](#documentation)

## Features

- User registration and authentication
- CRUD operations for movies, genres, and directors
- Add and remove favorite movies for users
- JWT-based authentication
- CORS support

## Installation
1. npm install
2. Create .Env file and add the following inside: 
 CONNECTION_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=your_port (default is 8080)
3. npm start

## API Endpoints
## API Endpoints

- **Movies**  
  - `GET /movies` - Get a list of all movies  
  - `GET /movies/:title` - Get data about a single movie by title  

- **Genres**  
  - `GET /genres/:name` - Get data about a genre by name  

- **Directors**  
  - `GET /directors/:name` - Get data about a director by name  

- **Users**  
  - `POST /users` - Register a new user  
  - `PUT /users/:username/update-username` - Update a user's username  
  - `DELETE /users/:username` - Delete a user account  
  - `POST /users/:username/favorites/:movieId` - Add a movie to a user's list of favorites  
  - `DELETE /users/:username/favorites/:movieId` - Remove a movie from a user's list of favorites  

## Authentication
The API uses JWT (JSON Web Token) for authentication. To access protected routes, include the JWT token in the Authorization header as a Bearer token.


## Documentation
The API documentation is generated using JSDoc. To generate the documentation, run: npx jsdoc -c jsdoc.json

