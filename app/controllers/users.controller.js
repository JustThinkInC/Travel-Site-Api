const Users = require('../models/users.model');

// POST: register a user
exports.register = async function(req, res) {
    try {
        let result = await Users.insert(req.body);
        res.setHeader("Content-Type", "application/json");
        res.statusMessage = 'Created';
        //res.json("Created");
        res.sendStatus(201);
    } catch (err) {
        res.setHeader("Content-Type", "application/json");
        res.json("Bad Request");
        res.statusMessage = 'Bad Request';
        //res.json("Bad Request");
        res.sendStatus(400);

    }
};