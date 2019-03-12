const Venues = require('../models/venues.model');

// GET all data
exports.view = function(req, res) {
    Venues.getAll(function(result) {
        res.json(result);
    })
};

// POST add a venue
exports.add = function(req, res) {
    Venues.insert(function(result) {
        res.json(result);
    })
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

exports.categories = function(req, res) {
    Venues.categories(function(result) {
      res.json(result);
    })
};