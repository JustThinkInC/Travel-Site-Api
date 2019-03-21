const Venues = require('../models/venues.model');

// GET all data
exports.view = async function(req, res) {
    try {
        let values = {
            "startIndex": req.query.startIndex, "count": req.query.count, "city": req.query.city, "q": req.query.q,
            "categoryId": req.query.catergoryId, "minStarRating": req.query.minStarRating,
            "maxCostRating": req.query.maxCostRating, "adminId": req.query.adminId, "sortBy": req.query.sortBy,
            "reverseSort": req.query.reverseSort, "latitude": req.query.myLatitude, "longitude": req.query.myLongitude
        };
        let result = await Venues.getAll(values);
        res.setHeader("Content-Type", "application/json");
        res.statusMessage = "OK";
        res.status(200);
        res.json(result);
    } catch (err) {
        console.log(err)
        res.setHeader("Content-Type", "application/json");
        res.statusMessage = "Bad Request";
        res.status(400);
        res.json();
    }
};

// POST add a venue
exports.add = async function(req, res) {
    try {
        let result = await Venues.insert(req.headers, req.body);
        res.setHeader("Content-Type", "application/json");
        res.statusMessage = 'Created';
        res.status(201);
        res.json({"venueId" : result.insertId});
    } catch (err) {
        res.setHeader("Content-Type", "application/json");
        if (err.name === "Unauthorized") {
            res.statusMessage =  "Unauthorized";
            res.status (401);
            res.json("Unauthorized");
        } else {
            res.statusMessage = 'Bad Request';
            res.status(400);
            res.json("Bad Request");
        }
    }
};

// GET a specific venue
exports.viewVenue = async function(req, res) {
    try {
        let result = await Venues.getVenue(req.params.id);
        res.setHeader("Content-Type", "application/json");
        res.statusMessage = 'OK';
        res.status(200);
        res.json(result);
    } catch (err) {
        res.setHeader("Content-Type", "application/json");
        res.statusMessage = 'Not Found';
        res.status(404);
        res.json("Not Found");
    }
};


// PATCH (update) a specific venue
exports.updateVenue = async function(req, res) {
    try {
        let result = await Venues.patchVenue(req);
        res.setHeader("Content-Type", "application/json");
        res.statusMessage = 'OK';
        res.status(200);
        res.json();
    } catch (err) {
        res.setHeader("Content-Type", "application/json");
        res.statusMessage = err.name;
        switch (err.name) {
            case "Bad Request":
                res.status(400);
                break;
            case "Unauthorized":
                res.status(401);
                break;
            case "Forbidden":
                res.status(403);
                break;
            case "Not Found":
                res.status(404);
        }
        res.json();
    }
};


// GET all data about venue categories
exports.categories = async function(req, res) {
    try {
        let result = await Venues.categories();
        res.setHeader("Content-Type", "application/json");
        res.statusMessage = 'OK';
        res.status(200);
        res.json(result);
    } catch (err) {
        res.setHeader("Content-Type", "application/json");
        res.statusMessage = 'Internal Server Error';
        res.status(500);
        res.json("Internal Server Error");
    }
};