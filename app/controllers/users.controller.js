const Users = require('../models/users.model');

// POST: register a user
exports.register = async function(req, res) {
    try {
        let result = await Users.insert(req.body);
        res.setHeader("Content-Type", "application/json");
        res.statusMessage = 'Created';
        res.status(201);
        res.json({"userId":result.insertId});
    } catch (err) {
        res.setHeader("Content-Type", "application/json");
        res.statusMessage = 'Bad Request';
        res.status(400);
        res.json("Bad Request");
    }
};


// POST: login an existing user
exports.login = async function(req, res) {
    try {
        let result = await Users.authorise(req.body);
        res.setHeader("Content-Type", "application/json");
        res.statusMessage = 'OK';
        res.status(200);
        res.json(result);
    } catch (err) {
        res.setHeader("Content-Type", "application/json");
        res.statusMessage = 'Bad Request';
        res.status(400);
        res.json("Bad Request");
    }
};


// POST: logout a currently logged in user
exports.logout = async function(req, res) {
    try {
        let result = await Users.logout(req.body);
        res.setHeader("Content-Type", "application/json");
        res.statusMessage = 'OK';
        res.status(200);
        res.json('OK');
    } catch (err) {
        res.setHeader("Content-Type", "application/json");
        // Note the US spelling of authorised
        res.statusMessage = 'Unauthorized';
        res.status(401);
        res.json("Unauthorized");
    }
};