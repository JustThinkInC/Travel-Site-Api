const db = require('../../config/db');
const AUTHERROR = {name:"Unauthorized", message:"Unauthorized"};
const NOTFOUNDERROR = {name:"Not Found", message:"Not Found"};
const FORBIDDENERROR = {name:"Forbidden", message:"Forbidden"};
const BADREQUESTERROR = {name:"Bad Request", message:"Bad Request"};


// POST: add a review for a venue
exports.addReview = async function(req) {
    const body = req.body;
    let id = req.params.id;
    let auth = req.headers["x-authorization"];
    let user;

    // Check authorisation
    if (typeof auth === "undefined" || auth === "" || auth === null) {
        throw AUTHERROR;
    } else {
        // Check user exists
        user = await db.getPool().query("SELECT * FROM User WHERE auth_token = ?", [auth]);
        if (typeof user[0] === "undefined") throw AUTHERROR;

        // Check user is not admin of venue
        const admin = await db.getPool().query("SELECT admin_id FROM Venue WHERE venue_id = ?", [id]);
        if (user[0]["user_id"] === admin[0]["admin_id"]) throw FORBIDDENERROR;

        // Ensure user has not already reviewed said venue
        let reviewedVenues = await db.getPool().query("SELECT reviewed_venue_id FROM Review WHERE review_author_id = ?",
            user[0]["user_id"]);
        reviewedVenues = JSON.parse(JSON.stringify(reviewedVenues));
        for(let i=0; i < Object.keys(reviewedVenues).length; i++) {
            if (reviewedVenues[i]["reviewed_venue_id"].toString() === id) throw FORBIDDENERROR;
        }
    }

    // Review details
    let review = [id, user[0]["user_id"], body["reviewBody"], body["starRating"], body["costRating"], new Date()];

    // Ensure all details exist
    for (let i=0; i < review.length; i++) {
        if (typeof review[i] === "undefined" || review[i] === "" || review[i] === null) throw BADREQUESTERROR;
    }

    // Check ratings are valid: non-decimal, and between 0 to 5 inclusive
    if ((0 > review[3] || review[3] > 5 || 0 > review[4] || review[4] > 5)) throw BADREQUESTERROR;
    if (review[3] % 1 !== 0 || review[4] % 1 !== 0) throw BADREQUESTERROR;

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
    if (numReviews === 0) throw NOTFOUNDERROR;

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