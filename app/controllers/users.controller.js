const Users = require('../models/users.model');

// POST: register a user
exports.register = async function(req, res) {
    try {
        let result = await Users.insert(req.body).insertId;
        res.setHeader("Content-Type", "application/json");
        res.statusMessage = 'Created';
        res.status(201);
        res.json("Created");
    } catch (err) {
        res.setHeader("Content-Type", "application/json");
        res.statusMessage = 'Bad Request';
        res.status(400);
        res.json("Bad Request");
    }
};