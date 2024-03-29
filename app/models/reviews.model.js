const db = require('../../config/db');
const globals = require('../../config/constants');


// POST: add a review for a venue
exports.addReview = async function(req) {
    const body = req.body;
    let id = req.params.id;
    let auth = req.headers["x-authorization"];
    let user;

    // Check authorisation
    if (typeof auth === "undefined" || auth === "" || auth === null) {
        throw globals.AUTH_ERROR;
    } else {
        // Check user exists
        user = await db.getPool().query("SELECT * FROM User WHERE auth_token = ?", [auth]);
        if (typeof user[0] === "undefined") throw globals.AUTH_ERROR;

        // Check user is not admin of venue
        const admin = await db.getPool().query("SELECT admin_id FROM Venue WHERE venue_id = ?", [id]);
        if (user[0]["user_id"] === admin[0]["admin_id"]) throw globals.FORBIDDEN_ERROR;

        // Ensure user has not already reviewed said venue
        let reviewedVenues = await db.getPool().query("SELECT reviewed_venue_id FROM Review WHERE review_author_id = ?",
            user[0]["user_id"]);
        reviewedVenues = JSON.parse(JSON.stringify(reviewedVenues));
        for(let i=0; i < Object.keys(reviewedVenues).length; i++) {
            if (reviewedVenues[i]["reviewed_venue_id"].toString() === id) throw globals.FORBIDDEN_ERROR;
        }
    }

    // Review details
    let review = [id, user[0]["user_id"], body["reviewBody"], body["starRating"], body["costRating"], new Date()];

    // Ensure all details exist
    for (let i=0; i < review.length; i++) {
        if (typeof review[i] === "undefined" || review[i] === "" || review[i] === null) throw globals.BAD_REQUEST_ERROR;
    }

    // Check ratings are valid: non-decimal, and between 0 to 5 inclusive
    if ((0 > review[3] || review[3] > 5 || 0 > review[4] || review[4] > 5)) throw globals.BAD_REQUEST_ERROR;
    if (review[3] % 1 !== 0 || review[4] % 1 !== 0) throw globals.BAD_REQUEST_ERROR;

    return await db.getPool().query("INSERT INTO Review(reviewed_venue_id, review_author_id, review_body, star_rating," +
        "cost_rating, time_posted) VALUES ?", [[review]]);
};


// GET: all reviews for a venue
exports.viewReviews = async function(id) {
    // Check venue exists
    let reviews = await db.getPool().query("SELECT review_author_id, review_body, star_rating, cost_rating, time_posted " +
        "FROM Review WHERE reviewed_venue_id = ? ORDER BY time_posted DESC", [id]);

    let numReviews = Object(reviews).length;
    // 404 if no reviews are found
    if (numReviews === 0) throw globals.NOT_FOUND_ERROR;

    // This will hold all the reviews of the venue after
    // building the JSON object of the review
    let result = [];

    for (let i = 0; i < numReviews; i++) {
        let userId = reviews[i]["review_author_id"];
        let user = await db.getPool().query("SELECT username FROM User WHERE user_id = ?", userId);
        let review = {"reviewAuthor":{"userId":userId, "username":user[0]["username"]}, "reviewBody":reviews[i]["review_body"],
                      "starRating":reviews[i]["star_rating"], "costRating":reviews[i]["cost_rating"],
                      "timePosted":reviews[i]["time_posted"]};

        result.push(review);
    }


    return result;
};


// GET reviews authored by user
exports.getUserReviews = async function(req) {
    let id = req.params.id;
    let auth = req.headers["x-authorization"];
    let result = [];

    // Check for non-existing auth token
    if (typeof auth === "undefined" || auth === null || auth === "") {
        throw globals.AUTH_ERROR;
    } else {
        // Check for invalid auth token
        let authUser = await db.getPool().query("SELECT user_id FROM User WHERE auth_token = ?", [auth]);
        if (typeof authUser[0] === "undefined") {
            throw globals.AUTH_ERROR;
        }
    }

    // Get all reviews and get username
    let reviews = await db.getPool().query("SELECT * FROM Review WHERE review_author_id = ?", [id]);
    let user = await db.getPool().query("SELECT username FROM User WHERE user_id = ?", [id]);

    // For each review, push its details to result list
    for (let i = 0; i < reviews.length && typeof reviews[i] !== "undefined"; i++) {
        // Get the venue details and primary photo
        let venue = await db.getPool().query("SELECT * FROM Venue WHERE venue_id = ?", reviews[i]["reviewed_venue_id"]);
        let venuePhoto = await db.getPool().query("SELECT photo_filename FROM VenuePhoto WHERE venue_id = ? " +
            "AND is_primary = 1", [venue[0]["venue_id"]]);

        result.push(
            {
                "reviewAuthor":{"userId":id, "username":user[0]["user_name"]}, "reviewBody":reviews[i]["review_body"],
                "starRating":reviews[i]["star_rating"], "costRating":reviews[i]["cost_rating"],
                "timePosted":reviews[i]["time_posted"], "venue":{"venueId":reviews[i]["reviewed_venue_id"],
                "venueName":venue[0]["venue_name"], "categoryName":venue[0]["category_name"],
                "city":venue[0]["city"], "shortDescription":venue[0]["short_description"],
                "primaryPhoto":(typeof venuePhoto[0] !== "undefined") ? venuePhoto[0]["photo_filename"] : null}
            });
    }


    return result;
};