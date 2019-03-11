const Venues = require('../models/venues.model');

exports.view = function(req, res) {
    Venues.getAll(function(result) {
        res.json(result);
    })
};