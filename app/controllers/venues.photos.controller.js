const Photos = require('../models/venues.photos.model');

// POST a photo for a venue
exports.add = async function(req, res) {
    try {
        let result = await Photos.insert(req);
        res.setHeader("Content-Type", "application/json");
        res.statusMessage = "Created";
        res.status(201);
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
                break;
            default:
                res.statusMessage = "Bad Request";
                res.status(400);
        }
        res.json();
    }
};


// GET a photo for a venue
exports.get = async function(req, res) {
    try {
        let result = await Photos.view(req.params.id, req.params.photoFilename);
        res.setHeader("Content-Type", "image/"+result["content"]);
        res.statusMessage = "OK";
        res.status(200);
        res.write(result["image"], "binary");
        res.end(null, "binary");
    } catch (err) {
        console.log(err)
        res.setHeader("Content-Type", "application/json");
        res.statusMessage = "Not Found";
        res.status(404);
        res.json();
    }
};