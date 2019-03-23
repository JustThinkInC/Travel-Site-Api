const db = require('../../config/db');
const globals = require('../../config/constants');

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


// Remove empty values from list
function removeEmpty(list) {
    let filtered = {};
    for(let key in list) {
        if (typeof list[key] !== "undefined") filtered[key] = list[key];
    }

    return filtered;
}


// Build up the SQL query
function buildQuery(filtered, qSearch, sortBy, latitude, longitude) {
    let query = [];
    let firstCondition = true;

    if (typeof filtered["maxCostRating"] !== "undefined") {
        if (firstCondition) {
            query.push(`WHERE mode_cost_rating <= ${filtered["maxCostRating"]}`);
            firstCondition = false;
        } else {
            query.push(`AND mode_cost_rating <= ${filtered["maxCostRating"]}`);
        }
        delete filtered["maxCostRating"];
    }
    if (typeof filtered["city"] !== "undefined") {
        if (firstCondition) {
            query.push(`WHERE city = '${filtered["city"]}'`);
            firstCondition = false;
        } else {
            query.push(`AND city = '${filtered["city"]}'`);
        }
        delete filtered["city"];
    }

    // Change keys to snake_case
    if (typeof filtered["adminId"] !== "undefined") {
        filtered["admin_id"] = filtered["adminId"];
        delete filtered["adminId"];
    }
    if (typeof filtered["categoryId"] !== "undefined") {
        filtered["category_id"] = filtered["categoryId"];
        delete filtered["categoryId"];
    }

    // Add conditions for rest of params to query
    for (let key in filtered) {
        if (firstCondition) {
            query.push(`WHERE ${key} = ${filtered[key]}`);
            firstCondition = false;
        } else {
            query.push(`AND ${key} = ${filtered[key]}`);
        }
    }

    // If the 'q' param exists
    // This param restricts results to venues with the search term in their title
    if (qSearch) {
        if (firstCondition) {
            query.push(`WHERE venue_name LIKE '%${qSearch}%'`);
        } else {
            query.push(`AND venue_name LIKE '%${qSearch}%'`);
        }
    }

    // Add the sorting filter
    // Default is star_rating from highest to lowest
    if (typeof sortBy !== "undefined") {
        if (sortBy.toLowerCase() === "distance") {
            if (typeof latitude === "undefined" || typeof longitude === "undefined") throw globals.BADREQUESTERROR;
        } else if (sortBy.toLowerCase() === "cost_rating") {
            query.push("ORDER BY mode_cost_rating");
        } else {
            query.push(`ORDER BY ${sortBy}`);
        }
    } else {
        query.push("ORDER BY star_rating DESC");
    }


    return query.join(" "); // Concatenate into single string
}


// Get the venues filtered result list
async function getVenuesResults(dbVenues, filters) {
    let count = filters[0], startIndex = filters[1], latitude = filters[2], longitude = filters[3], starRating = filters[4];
    let result = [];
    const costs = await getCosts();
    const photos = await getPrimaryPhotos();

    if (typeof count === "undefined") count = dbVenues.length;
    for(let i=0; typeof dbVenues[i] !== "undefined" && i <= count; i++) {
        let starRatings = await db.getPool().query("SELECT AVG(star_rating) AS average FROM Review WHERE " +
            "reviewed_venue_id = ?", [dbVenues[i]["venue_id"]]);

        if (typeof starRatings[0] !== "undefined" && typeof starRating !== "undefined" && starRatings[0]["average"] < starRating) {continue;}

        result.push(
            {"venueId":dbVenues[i]["venue_id"], "venueName":dbVenues[i]["venue_name"],
                "categoryId":dbVenues[i]["category_id"], "city":dbVenues[i]["city"],
                "shortDescription":dbVenues[i]["short_description"], "latitude":dbVenues[i]["latitude"],
                "longitude": dbVenues[i]["longitude"],
                "meanStarRating": (starRatings[0]["average"] !== null) ? starRatings[0]["average"] : undefined,
                "modeCostRating":costs[dbVenues[i]["venue_id"]],
                "primaryPhoto":photos[dbVenues[i]["venue_id"]],
                "distance":
                    (typeof latitude !== "undefined" && typeof longitude !== "undefined") ?
                        getDistance(dbVenues[i]["latitude"], latitude, dbVenues[i]["longitude"], longitude) : undefined}
        )
    }
    startIndex = (startIndex === result.length) ? result.length - 1 : startIndex;


    return result.slice(startIndex);
}


// GET /venues
exports.getAll = async function(values) {
    let finalQuery;
    let filtered = removeEmpty(values);

    // Get the non-SQL query params
    let qSearch = filtered["q"];
    let startIndex = filtered["startIndex"];
    let count = filtered["count"];
    let reverseSort = filtered["reverseSort"];
    let sortBy = filtered["sortBy"];
    let starRating = filtered["minStarRating"];
    let latitude = filtered["latitude"];
    let longitude = filtered["longitude"];

    // Remove the non-SQL query params if they exist
    if (typeof filtered["q"] !== "undefined") delete filtered["q"];
    if (typeof filtered["startIndex"] !== "undefined") delete filtered["startIndex"];
    if (typeof filtered["count"] !== "undefined") delete filtered["count"];
    if (typeof filtered["reverseSort"] !== "undefined") delete filtered["reverseSort"];
    if (typeof filtered["sortBy"] !== "undefined") delete filtered["sortBy"];
    if (typeof filtered["minStarRating"] !== "undefined") {
        if (starRating > 5 || starRating < 0) throw globals.BADREQUESTERROR;
        delete filtered["minStarRating"];
    }
    if (typeof filtered["latitude"] !== "undefined") delete filtered["latitude"];
    if (typeof filtered["longitude"] !== "undefined") delete filtered["longitude"];


    const filters = [count, startIndex, latitude, longitude, starRating];
    if (Object.keys(filtered).length === 0) {
        finalQuery = await db.getPool().query("SELECT venue_id, venue_name, category_id, city, short_description, " +
            "latitude, longitude FROM Venue");
    } else {
        let query = buildQuery(filtered, qSearch, sortBy, latitude, longitude);
        finalQuery =  await db.getPool().query(
            "SELECT DISTINCT V.venue_id, V.venue_name, V.category_id, V.city, V.short_description, V.latitude, V.longitude " +
            "FROM Venue V INNER JOIN Review R ON V.venue_id = R.reviewed_venue_id INNER JOIN ModeCostRating M " +
            "ON R.reviewed_venue_id = M.venue_id " + query );
        console.log(query);
    }


    return await getVenuesResults(finalQuery, filters);
};


// POST: add a venue
exports.insert = async function(headers, body) {
    // Check if authorization exists
    let auth = headers["x-authorization"];
    if (auth === '' || typeof auth === "undefined" || auth === null) throw globals.AUTHERROR;

    // Validate token exists
    let user = (await db.getPool().query("SELECT user_id, auth_token FROM User WHERE auth_token = ?", [auth]))[0];
    if (typeof user === "undefined" || user["auth_token"] === null || typeof user["auth_token"] === "undefined") throw globals.AUTHERROR;

    // Construct info array
    let info = [user["user_id"], body.venueName, body.categoryId, body.city, body.shortDescription, body.longDescription,
               new Date(), body.address, body.latitude, body.longitude];

    // Check no value is null or undefined
    for (let i = 1; i < info.length; i++) {
           if (typeof info[i] === "undefined" || info[i] === '') throw globals.BADREQUESTERROR;
    }
    // Ensure latitude/longitude are in valid ranges
    if (! (-90 <= info[8] && info[8] <= 90 && -180 <= info[9] && info[9] <= 180)) throw globals.BADREQUESTERROR;

    // Check categoryId exists
    const categoryId = (await db.getPool().query("SELECT * FROM VenueCategory WHERE category_id = ?", [info[2]]))[0];

    if (typeof categoryId === "undefined") throw globals.BADREQUESTERROR;

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
        throw globals.AUTHERROR;
    } else {
        venue = await db.getPool().query("SELECT * FROM Venue WHERE venue_id = ?", [id]);
        if (typeof venue[0] === "undefined") throw globals.NOTFOUNDERROR;
        // Get user id of person attempting authorization
        let user = await db.getPool().query("SELECT user_id FROM User WHERE auth_token = ?", [auth]);
        // If user is not admin, operation is forbidden
        if (typeof user[0] === "undefined" || user[0]["user_id"] !== venue[0]["admin_id"]) throw globals.FORBIDDENERROR;
    }

    // Updated information
    let info = {"venue_name":body["venueName"], "category_id":body["categoryId"], "city":body["city"],
        "short_description":body["shortDescription"], "long_description":body["longDescription"],
        "address":body["address"], "latitude":body["latitude"], "longitude":body["longitude"]};

    // Check information exists
    for(let key in info) {
        if (typeof info[key] === "undefined" || info[key] === null) delete info[key];
    }

    if (Object.keys(info).length === 0) throw globals.BADREQUESTERROR;

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
