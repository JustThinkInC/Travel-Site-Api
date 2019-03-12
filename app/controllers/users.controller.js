const Users = require('../models/users.model');

// POST: register a user
exports.register = async function(req, res) {
    try {
        let result = await Users.insert(req.body, function(result) {
            res.json(result);
        });
        res.statusMessage = 'Created';
        res.status(201);
    } catch (err) {
        res.statusMessage = 'Bad Request';
        res.status(401);
    }
};