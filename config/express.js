const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({storage:storage});

const allowCrossOriginRequests = function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
    next();
};

module.exports = function () {
    const app = express();
    app.rootUrl = '/api/v1';

    // MIDDLEWARE
    app.use(allowCrossOriginRequests);
    app.use(bodyParser.json());
    app.use(bodyParser.raw({ type: 'text/plain' }));  // for the /executeSql endpoint
    app.use(bodyParser.raw({inflate:"true", limit:"5mb", type:["image/jpeg", "image/png"]}));
    app.use(upload.single('photo'));    // Use multer package for multipart/form-data

    // ROUTES
    require('../app/routes/backdoor.routes')(app);
    require('../app/routes/venues.routes')(app);
    require('../app/routes/venues.photos.routes')(app);
    require('../app/routes/users.routes')(app);
    require('../app/routes/users.photos.routes')(app);
    require('../app/routes/reviews.routes')(app);

    // Create the photo directories if not exist
    if (!fs.existsSync("app/user.photos/")) {
        fs.mkdirSync("app/user.photos/");
    }
    if (!fs.existsSync("app/venue.photos/")) {
        fs.mkdirSync("app/venue.photos/");
    }

    // DEBUG (you can remove this)
    app.get('/', function (req, res) {
        res.send("<font face='helvetica, arial'><h1> Welcome to the SENG365 Travel Site API</h1>" +
            "<br><h2>Supported Endpoints:</h2>" +
            "<h3>Venues</h3>" +
            "<ul>" +
            "<li>GET /venues &emsp; <i>view venues</i></li>" +
            "<li>POST /venues &emsp; <i>Add a new venue</i></li>" +
            "<li>PATCH /venues/{id} &emsp; <i>Change a venue's details</i></li>" +
            "<li>GET /categories &emsp; <i>Retrieves all data about venue categories</i></li>" +
            "</ul><br>" +
            "<h3>Venues Photos</h3>" +
            "<ul>" +
            "<li>POST /venues/{id}/photos &emsp; <i>Add a photo to a venue</i></li>" +
            "<li>GET /venues/{id}/photos/{photoFilename} &emsp; <i>Retrieve a given photo for a venue</i></li>" +
            "<li>DELETE /venues/{id}/photos/{photoFilename} &emsp; <i>Delete a venue's photo</i></li>" +
            "<li>POST /venues/{id}/photos/{photoFilename}/setPrimary &emsp; <i>Set a photo as the primary one for this venue</i></li>" +
            "</ul><br>" +
            "<h3>Reviews</h3>" +
            "<ul>" +
            "<li>GET /venues/{id}/reviews &emsp; <i>Retrieves a venue's reviews</i></li>" +
            "<li>POST /venues/{id}/reviews &emsp; <i>Post a review for a venue</i></li>" +
            "<li>GET /users/{id}/reviews &emsp; <i>Retrieves all the reviews authored by a given user</i></li>" +
            "</ul><br>" +
            "<h3>Users</h3>" +
            "<uL>" +
            "<li>POST /users &emsp; <i>Register as a new user</i></li>" +
            "<li>POST /users/login &emsp; <i>Login as an existing user</i></li>" +
            "<li>POST /users/logout &emsp; <i>Logs out the currently authorised user</i></li>" +
            "<li>GET /users/{id} &emsp; <i>Retrieve all information about a user</i></li>" +
            "<li>PATCH /users/{id} &emsp; <i>Change a user's details</i></li>" +
            "</uL><br>" +
            "<h3>User's Photos</h3>" +
            "<ul>" +
            "<li>GET /users/{id}/photo &emsp; <i>Retrieve a user's profile photo</i></li>" +
            "<li>PUT /users/{id}/photo &emsp; <i>Set a user's profile photo</i></li>" +
            "<li>DELETE /users/{id}/photo &emsp; <i>Delete a user's profile photo</i></li>" +
            "</ul></font face>")
    });

    return app;
};
