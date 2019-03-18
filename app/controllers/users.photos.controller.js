const Photos = require('../models/users.photos.model');

// PUT a photo for a user
exports.add = async function(req, res) {
    try {
        let result = await Photos.insert(req);
        res.setHeader("Content-Type", "application/json");
        res.statusMessage = result["message"];
        res.status(result["status"]);
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


// GET a photo for a user
exports.get = async function(req, res) {
    try {
        let result = await Photos.insert(req);
        res.setHeader("Content-Type", "application/json");
        res.statusMessage = result["message"];
        res.status(result["status"]);
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