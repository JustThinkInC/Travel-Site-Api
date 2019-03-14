const db = require('../../config/db');

const unimplemented = {"Error" : "Unimplemented"};  // Unimplemented error message in JSON

exports.getAll = function(values, done) {
    let query = [];
    // let startIndex = values[0];
    // let count = values[1];
    // let city = values[2];
    // let q = values[3];
    // let categoryId = values[4];
    // let minStarRating = values[5];
    // let maxCostRating = values[6];
    // let adminId = values[7];
    // let sortyBy = values[8];
    // let reverseSort = values[9];
    // let myLatitude = values[10];
    // let myLongitude = values[11];

    if (typeof values[2] !== undefined) {
        query.push("city = ?");
    }
    if (typeof values[4] !== undefined) {
        query.push("category_id = ?");
    }
    if (typeof values[7] !== undefined) {
        query.push("admin_id = ?");
    }
    if (typeof values[10] !== undefined) {
        query.push("latitude = ?");
    }
    if (typeof values[11] !== undefined) {
        query.push("longitude = ?");
    }

    query = (query.length) ? query.join (' AND ') : '1';
    console.log(query);
    // db.getPool().query("SELECT * FROM Venue WHERE (@city IS NULL OR city=?) " +
    //     "AND (@category_id IS NULL OR category_id=?) " +
    //     "AND (@admin_id IS NULL OR admin_id=?) " +
    //     "AND (@latitude IS NULL OR latitude=?) " +
    //     "AND (@longitude IS NULL or longitude=?)", city, categoryId, adminId, myLatitude, myLongitude, function(err, rows) {
    db.getPool().query("SELECT * FROM Venue WHERE ?" + query, [values[2], values[4], values[7], values[10], values[11]],function(err, rows) {
        if (err) return done(err);
        done(rows);
    });
};


// POST: add a venue
exports.insert = async function(headers, body) {
    const authError = {name:"Unauthorized", message:"Unauthorized"};

    // Check if authorization exists
    let auth = headers["x-authorization"];
    if (auth === '' || typeof auth === "undefined" || auth === null) throw authError;

    // Validate token exists
    let user = (await db.getPool().query("SELECT user_id, auth_token FROM User WHERE auth_token = ?", [auth]))[0];
    if (typeof user === "undefined" || user["auth_token"] === null || typeof user["auth_token"] === "undefined") throw authError;

    // Construct info array
    let info = [user["user_id"], body.venueName, body.categoryId, body.city, body.shortDescription, body.longDescription,
               new Date(), body.address, body.latitude, body.longitude];

    // Check no value is null or undefined
    for (let i = 1; i < info.length; i++) {
           if (typeof info[i] === "undefined" || info[i] === '') throw ("Missing field");
    }

    // Ensure latitude/longitude are in valid ranges
    if (! (-90 <= info["latitude"] <= 90 || -180 <= info["longitude"] <= 180)) throw ("Invalid latitude or longitude");

    // Check categoryId exists
    const categoryId = (await db.getPool().query("SELECT * FROM VenueCategory WHERE category_id = ?", [info[2]]))[0];

    if (typeof categoryId === "undefined") throw ("Invalid category");

    return await db.getPool().query("INSERT INTO Venue(admin_id, venue_name, category_id, city, short_description, " +
        "long_description, date_added, address, latitude, longitude) VALUES (?)", [info]);

};

exports.getVenue = function(done) {
    done(unimplemented);
};

exports.patchVenue = function(done) {
    done(unimplemented);
};


// GET: all data about venue categories
exports.categories = async function() {
    return unimplemented;
};
