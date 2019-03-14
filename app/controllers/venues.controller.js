const Venues = require('../models/venues.model');

// GET all data
exports.view = function(req, res) {
    let values = [req.params.startIndex, req.params.count, req.params.city,
                  req.params.q, req.params.catergoryId, req.params.minStarRating,
                  req.params.maxCostRating, req.params.adminId, req.params.sortBy,
                  req.params.reverseSort, req.params.myLatitude, req.params.myLongitude]
    Venues.getAll(values,function(result) {
        res.json(result);
    });
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
exports.viewVenue = function(req, res) {
    Venues.getVenue(function(result) {
        res.json(result);
    })
};

// PATCH (update) a specific venue
exports.updateVenue = function(req, res) {
    Venues.patchVenue(function(result) {
        res.json(result);
    })
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