const Reviews = require('../models/reviews.model');

// POST a review for a venue
exports.review = async function(req, res) {
    try {
        let result = await Reviews.addReview(req);
        res.setHeader("Content-Type", "application/json");
        res.statusMessage = 'Created';
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
        }
        res.json();
    }
};

// GET all reviews for a specific venue
exports.view = async function(req, res) {
    try {
        let result = await Reviews.viewReviews(req.params.id);
        res.setHeader("Content-Type", "application/json");
        res.statusMessage = 'OK';
        res.status(200);
        res.json(result);
    } catch (err) {
        res.setHeader("Content-Type", "application/json");
        res.statusMessage = "Not Found";
        res.status(404);
        res.json();
    }
};


// GET reviews by specific user
exports.getUserReviews = async function(req, res) {
    try {
        let result = await Reviews.getUserReviews(req);
        res.setHeader("Content-Type", "application/json");
        res.statusMessage = 'OK';
        res.status(200);
        res.json(result);
    } catch (err) {
        res.setHeader("Content-Type", "application/json");
        res.statusMessage = err.name;
        switch (err.name) {
            case "Unauthorized":
                res.status(401);
                break;
            case "Not Found":
                res.status(404);
        }
        res.json();
    }
};