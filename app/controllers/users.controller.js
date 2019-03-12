const Users = require('../models/users.model');

// POST: register a user
exports.register = function(req, res) {
    Users.insert(req.body, function(result) {
        res.json(result);
    })
};