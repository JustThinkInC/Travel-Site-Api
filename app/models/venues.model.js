const db = require('../../config/db');

const unimplemented = {"Error" : "Unimplemented"};  // Unimplemented error message in JSON
const AUTHERROR = {name:"Unauthorized", message:"Unauthorized"};
const NOTFOUNDERROR = {name:"Not Found", message:"Not Found"};
const FORBIDDENERROR = {name:"Forbidden", message:"Forbidden"};

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
    // Check if authorization exists
    let auth = headers["x-authorization"];
    if (auth === '' || typeof auth === "undefined" || auth === null) throw AUTHERROR;

    // Validate token exists
    let user = (await db.getPool().query("SELECT user_id, auth_token FROM User WHERE auth_token = ?", [auth]))[0];
    if (typeof user === "undefined" || user["auth_token"] === null || typeof user["auth_token"] === "undefined") throw AUTHERROR;

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

// GET specific venue
exports.getVenue = async function(id) {
    const venueRaw = await db.getPool().query("SELECT * FROM Venue WHERE venue_id = ?", id);
    let venueJSON = JSON.parse(JSON.stringify(venueRaw[0]));

    // Get admin and category IDs, then remove them from JSON object
    let admin = venueJSON["admin_id"];
    let categoryID = venueJSON["category_id"];
    delete venueJSON["amdin_id"];
    delete venueJSON["category_id"];

    // Get admin and category information
    let adminInfo = await db.getPool().query("SELECT user_id, username FROM User WHERE user_id = ?", admin);
    let categoryInfo = await db.getPool().query("SELECT * FROM VenueCategory WHERE category_id = ?", categoryID);

    // Convert the information to JSON
    adminInfo = JSON.parse(JSON.stringify(adminInfo[0]));
    categoryInfo = JSON.parse(JSON.stringify(categoryInfo[0]));

    // Change keys to match expected JSON output
    adminInfo["userId"] = adminInfo["user_id"];
    categoryInfo["categoryId"] = categoryInfo["category_id"];
    categoryInfo["categoryName"] = categoryInfo["category_name"];
    categoryInfo["categoryDescription"] = categoryInfo["category_description"];

    // Delete unexpected format keys
    delete adminInfo["user_id"];
    delete categoryInfo["category_id"];
    delete categoryInfo["category_name"];
    delete categoryInfo["category_description"];

    // Return all information as JSON
    return {"venueName":venueJSON["venue_name"], "admin":adminInfo, "category":categoryInfo, "city":venueJSON["city"],
            "shortDescription":venueJSON["short_description"], "longDescription":venueJSON["long_description"],
            "dateAdded":venueJSON["date_added"], "address":venueJSON["address"], "latitude":venueJSON["latitude"],
        "longitude":venueJSON["longitude"]}
};

// PATCH (update) specific venue
exports.patchVenue = async function(req) {
    const body = req.body;
    let id = req.params.id;
    let auth = req.headers["x-authorization"];
    let venue;

    // Check authorisation
    if (typeof auth === "undefined" || auth === "" || auth === null) {
        throw AUTHERROR;
    } else {
        venue = await db.getPool().query("SELECT * FROM Venue WHERE venue_id = ?", [id]);
        if (typeof venue[0] === "undefined") throw NOTFOUNDERROR;
        // Get user id of person attempting authorization
        let user = await db.getPool().query("SELECT user_id FROM User WHERE auth_token = ?", [auth]);
        // If user is not admin, operation is forbidden
        if (typeof user[0] === "undefined" || user[0]["user_id"] !== venue[0]["admin_id"]) throw FORBIDDENERROR;
    }

    // Updated information
    let info = {"venue_name":body["venueName"], "category_id":body["categoryId"], "city":body["city"],
        "short_description":body["shortDescription"], "long_description":body["longDescription"],
        "address":body["address"], "latitude":body["latitude"], "longitude":body["longitude"]};

    // Check information exists
    for(let key in info) {
        if (typeof info[key] === "undefined" || info[key] === null) delete info[key];
    }

    if (Object.keys(info).length === 0) throw {name:"Bad Request", message:"Bad Request"};

    return await db.getPool().query("UPDATE Venue SET ? WHERE venue_id = ?", [info, id]);
};


// GET: all data about venue categories
exports.categories = async function() {
    const result = await db.getPool().query("SELECT * FROM VenueCategory");
    let jsonRaw = JSON.parse(JSON.stringify(result));

    // Change from snake case to camel case for automated tests
    for(let i=0; i < jsonRaw.length; i++) {
        jsonRaw[i]["categoryId"] = jsonRaw[i]["category_id"];
        jsonRaw[i]["categoryName"] = jsonRaw[i]["category_name"];
        jsonRaw[i]["categoryDescription"] = jsonRaw[i]["category_description"];
        delete jsonRaw[i]["category_id"];
        delete jsonRaw[i]["category_name"];
        delete jsonRaw[i]["category_description"];
    }

    return jsonRaw;
};
