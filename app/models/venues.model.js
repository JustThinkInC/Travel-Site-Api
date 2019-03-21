const db = require('../../config/db');

const unimplemented = {"Error" : "Unimplemented"};  // Unimplemented error message in JSON
const AUTHERROR = {name:"Unauthorized", message:"Unauthorized"};
const NOTFOUNDERROR = {name:"Not Found", message:"Not Found"};
const FORBIDDENERROR = {name:"Forbidden", message:"Forbidden"};


/**
 * Convert degrees to Radians
 * @param deg
 * @returns {number}
 */
function toRadians(deg) {
    return deg * (Math.PI/180)
}


/**
 * Get distance between two latitude, longitude coordinates
 * Based on the Haversine formula of:
 *      a = sin²(Δφ/2) + cos φ1 ⋅ cos φ2 ⋅ sin²(Δλ/2)
 *      c = 2 ⋅ atan2( √a, √(1−a) )
 *      d = R ⋅ c
 * Where φ is latitude, λ is longitude, R is earth’s radius in KM (6371)
 * @param lat1 First latitude coordinate
 * @param lat2 Second latitude coordinate
 * @param lon1 First longitude coordinate
 * @param lon2 Second longitude coordinate
 * @returns {number} Distance in KM
 */
function getDistance(lat1, lat2, lon1, lon2) {
    const earthRadius = 6371; // Radius of the earth in km

    // Change in latitude and longitude
    let deltaLat = toRadians(lat2-lat1);
    let deltaLon = toRadians(lon2-lon1);

    let a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    // Distance in KM
    let distance = earthRadius * c;


    return distance;
}


// Get all primary photos
async function getPrimaryPhotos() {
    let primaryPhotos = await db.getPool().query("SELECT venue_id, photo_filename FROM VenuePhoto WHERE is_primary = 1");
    let photos = {};
    for (let i = 0; typeof primaryPhotos[i] !== "undefined"; i ++) {
        let photo_id = primaryPhotos[i]["venue_id"];
        photos[photo_id] = primaryPhotos[i]["photo_filename"].substr(2);
    }


    return photos;
}


// Get all mode cost ratings
async function getCosts() {
    let costRatings = await db.getPool().query("SELECT * FROM ModeCostRating");
    let costs = {};
    for (let i = 0; typeof costRatings[i] !== "undefined"; i ++) {
        let venue_id = costRatings[i]["venue_id"];
        costs[venue_id] = costRatings[i]["mode_cost_rating"];
    }

    return costs;
}


// GET /venues
exports.getAll = async function(values) {
    let query = [];
    let latitude =10;
    let longitude = 20;
    let result = [];

    
    if (values.length === 0) {
        let venues = await db.getPool().query("SELECT venue_id, venue_name, category_id, city, short_description, latitude," +
            " longitude FROM Venue");

        let costs = await getCosts();
        let photos = await getPrimaryPhotos();

        for(let i=0; typeof venues[i] !== "undefined"; i++) {
            let starRatings = await db.getPool().query("SELECT AVG(star_rating) AS average FROM Review WHERE reviewed_venue_id = ?",
                [venues[i]["venue_id"]]);

            result.push(
                {"venueId":venues[i]["venue_id"], "venueName":venues[i]["venue_name"],
                    "categoryId":venues[i]["category_id"], "city":venues[i]["city"],
                    "shortDescription":venues[i]["short_description"], "latitude":venues[i]["latitude"],
                    "longitude": venues[i]["longitude"],
                    "meanStarRating":starRatings[0]["average"],
                    "modeCostRating":costs[venues[i]["venue_id"]],
                    "primaryPhoto":photos[venues[i]["venue_id"]],
                    "distance":getDistance(venues[i]["latitude"], latitude, venues[i]["longitude"], longitude)}
            )
        }
    }
    return result;
    for (let i = 0; i < values.length; i++) {
        //if (typeof values[i] === "undefined")
    }

    let startIndex = values[0];
    let count = values[1];
    let city = values[2];
    let q = values[3];
    let categoryId = values[4];
    let minStarRating = values[5];
    let maxCostRating = values[6];
    let adminId = values[7];
    let sortBy = values[8];
    let reverseSort = values[9];
    let myLatitude = values[10];
    let myLongitude = values[11];

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

    let venuePhotos = await db.getPool().query("SELECT photo_filename, photo_description, is_primary FROM VenuePhoto " +
                                                "WHERE venue_id = ?", [id]);

    let photos = [];

    for (let i = 0; typeof venuePhotos[i] !== "undefined"; i++) {
        photos.push({"photoFilename":venuePhotos[i]["photo_filename"].substr(2),
            "photoDescription":venuePhotos[i]["photo_description"], "isPrimary":venuePhotos[i]["is_primary"] === 1})
    }

    // Return all information as JSON
    return {"venueName":venueJSON["venue_name"], "admin":adminInfo, "category":categoryInfo, "city":venueJSON["city"],
            "shortDescription":venueJSON["short_description"], "longDescription":venueJSON["long_description"],
            "dateAdded":venueJSON["date_added"], "address":venueJSON["address"], "latitude":venueJSON["latitude"],
        "longitude":venueJSON["longitude"], "photos":photos};
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
