const db = require('../../config/db');
const fs = require("mz/fs");
const globals = require('../../config/constants');
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
    if (typeof venue[0] === "undefined") throw globals.NOT_FOUND_ERROR;

    // Bad request if no photo
    if (typeof photoData === "undefined") throw globals.BAD_REQUEST_ERROR;

    // Check valid description and make primary fields
    if (typeof description === "undefined" || description === null) throw globals.BAD_REQUEST_ERROR;
    if (typeof makePrimary === "undefined" || !(makePrimary !== "true "|| makePrimary !== "false")) throw globals.BAD_REQUEST_ERROR;

    //Check authorisation
    if (typeof auth === "undefined" || auth === "" || auth === null) {
        throw globals.AUTH_ERROR;
    }

    // Check user exists for auth token
    user = await db.getPool().query("SELECT * FROM User WHERE auth_token = ?", [auth]);
    if (typeof user[0] === "undefined") throw globals.AUTH_ERROR;

    // Check user is admin
    const admin = await db.getPool().query("SELECT admin_id FROM Venue WHERE venue_id = ?", [id]);
    if (typeof admin[0] === "undefined" || admin[0]["admin_id"] !== user[0]["user_id"]) throw globals.FORBIDDEN_ERROR;

    let binary = photoData["buffer"];   // Photo file binary
    let filename = photoData["originalname"]; // Note this contains the extension of the file
    let newFileName = FOLDER + id + "_" + filename;

    // Save the file to the venue photos' folder
    await fs.writeFile(newFileName, binary);

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



// GET: a venue's photo by filename
exports.view = async function(id, photoFileName) {
    let response = {"content":"png", "image":null};
    const storedName = FOLDER + id + "_" + photoFileName;
    if (await fs.exists(storedName)) {
        let extension = photoFileName.split(".").pop();
        response["content"] = (extension === "jpg") ? "jpeg" : extension;
        response["image"] = await fs.readFile(storedName);
        return response;
    }

    throw globals.NOT_FOUND_ERROR;
};


// DELETE a venue's photo by filename
exports.delete = async function(req) {
    const auth = req.headers["x-authorization"];
    const id = req.params.id;
    const photoFileName = req.params.photoFilename;
    const storedName = FOLDER + id + "_" + photoFileName;

    if (!await fs.exists(storedName)) {
        throw globals.NOT_FOUND_ERROR;
    } else if (typeof auth === "undefined" || auth === null) {
        throw globals.AUTH_ERROR;
    }

    // Check venue exists
    const venueExists = await db.getPool().query("SELECT venue_id, admin_id FROM Venue WHERE venue_id = ?" ,[id]);
    if (typeof venueExists[0] === "undefined") throw globals.NOT_FOUND_ERROR;

    // Check user is admin of venue
    const user = await db.getPool().query("SELECT user_id FROM User WHERE auth_token = ?", [auth]);
    if (typeof user[0] === "undefined" || user[0]["user_id"] !== venueExists[0]["admin_id"]) throw globals.FORBIDDEN_ERROR;

    //Check if photo is primary
    const isPrimary = await db.getPool().query("SELECT is_primary FROM VenuePhoto WHERE venue_id = ? AND " +
                                                "photo_filename = ?", [id, photoFileName]);

    if (typeof isPrimary !== "undefined" && isPrimary === 1) {
        await db.getPool().query("UPDATE is_primary = 1 WHERE venue_id = ? LIMIT 1", [id]);
    }

    await fs.unlink(storedName);
    return await db.getPool("DELETE FROM VenuePhoto WHERE venue_id = ? AND photo_filename = ?", [id, photoFileName]);
};