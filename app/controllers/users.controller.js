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
        let result = await Users.logout(req.headers);
        res.setHeader("Content-Type", "application/json");
        res.statusMessage = 'OK';
        res.status(200);
        res.json('OK');
    } catch (err) {
        res.setHeader("Content-Type", "application/json");
        // Note the US spelling of unauthorised
        res.statusMessage = 'Unauthorized';
        res.status(401);
        res.json("Unauthorized");
    }
};


// GET: View specific users details
exports.getUser = async function(req, res) {
    try {
        let result = await Users.get(req);
        res.setHeader("Content-Type", "application/json");
        res.statusMessage = 'OK';
        res.status(200);
        res.json(result);
    } catch (err) {
        res.setHeader("Content-Type", "application/json");
        // Note the US spelling of unauthorised
        res.statusMessage = 'Not Found';
        res.status(404);
        res.json("Not Found");
    }
};


// PATCH (update) a specific venue
exports.patchUser = async function(req, res) {
    try {
        let result = await Users.patchUser(req);
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