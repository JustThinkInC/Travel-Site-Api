const db = require('../../config/db');
const fs = require("fs");
const AUTHERROR = {name:"Unauthorized", message:"Unauthorized"};
const NOTFOUNDERROR = {name:"Not Found", message:"Not Found"};
const FORBIDDENERROR = {name:"Forbidden", message:"Forbidden"};
const BADREQUESTERROR = {name:"Bad Request", message:"Bad Request"};
const FOLDER = "app/venue.photos/";

// POST: add photo for venue
exports.insert = async function(req) {
    const auth = req.headers["x-authorization"];
    const id = req.params.id;
    const description = req.body["description"];
    let makePrimary = req.body["makePrimary"];
    let photoData = req.file;
    let user;
    
    // If venue doesn't exist
    let venue = await db.getPool().query("SELECT venue_id FROM Venue WHERE venue_id = ?", [id]);
    if (typeof venue[0] === "undefined") throw NOTFOUNDERROR;

    // Bad request if no photo
    if (typeof photoData === "undefined") throw BADREQUESTERROR;

    // Check valid description and make primary fields
    if (typeof description === "undefined" || description === null) throw BADREQUESTERROR;
    if (typeof makePrimary === "undefined" || !(makePrimary !== "true "|| makePrimary !== "false")) throw BADREQUESTERROR;

    //Check authorisation
    if (typeof auth === "undefined" || auth === "" || auth === null) {
        throw AUTHERROR;
    }

    // Check user exists for auth token
    user = await db.getPool().query("SELECT * FROM User WHERE auth_token = ?", [auth]);
    if (typeof user[0] === "undefined") throw AUTHERROR;

    // Check user is admin
    const admin = await db.getPool().query("SELECT admin_id FROM Venue WHERE venue_id = ?", [id]);
    if (typeof admin[0] === "undefined" || admin[0]["admin_id"] !== user[0]["user_id"]) throw FORBIDDENERROR;

    let binary = photoData["buffer"];   // Photo file binary
    let filename = photoData["originalname"]; // Note this contains the extension of the file
    let newFileName = FOLDER + id + "_" + filename;

    // Save the file to the venue photos' folder
    fs.writeFileSync(newFileName, binary);

    if (makePrimary === "true") {
        await db.getPool().query("UPDATE VenuePhoto SET is_primary = false WHERE is_primary = true");
        makePrimary = 1;
    } else {
        makePrimary = 0;
    }

    // If venue doesn't have primary photo, make this photo primary
    let hasPrimary = await db.getPool().query("SELECT * FROM VenuePhoto WHERE is_primary = true");
    if (typeof hasPrimary[0] === "undefined") {
        makePrimary = 1;
    }


    let info = [id, newFileName.substring(FOLDER.length).toString(), description.toString(), makePrimary];

    return await db.getPool().query('INSERT INTO VenuePhoto(venue_id, photo_filename, photo_description, is_primary) ' +
                                    'VALUES ?', [[info]]);
};