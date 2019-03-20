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
        res.send({ 'message': 'Hello World!' })
    });

    return app;
};
