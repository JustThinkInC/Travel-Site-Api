const Users = require('../models/users.model');

// POST: register a user
exports.register = async function(req, res) {
    try {
        let result = await Users.insert(req.body);
        res.statusMessage = 'Created';
        res.sendStatus(201);
    } catch (err) {
        res.statusMessage = 'Bad Request';
        res.sendStatus(400);
    }
};