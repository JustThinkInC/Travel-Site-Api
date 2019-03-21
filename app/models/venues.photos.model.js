const db = require('../../config/db');
const fs = require("mz/fs");
const AUTHERROR = {name:"Unauthorized", message:"Unauthorized"};
const NOTFOUNDERROR = {name:"Not Found", message:"Not Found"};
const FORBIDDENERROR = {name:"Forbidden", message:"Forbidden"};
const BADREQUESTERROR = {name:"Bad Request", message:"Bad Request"};
const FOLDER = "app/venue.photos/";

// POST: add photo for venue
exports.insert = async function(req) {
    const auth = req.headers["x-authorization"];
    const id = req.params.id;
    const description = req.body["description\n"];
    let makePrimary = req.body["makePrimary\n"];
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

    throw NOTFOUNDERROR;
};


// DELETE a venue's photo by filename
exports.delete = async function(req) {
    const auth = req.headers["x-authorization"];
    const id = req.params.id;
    const photoFileName = req.params.photoFilename;
    const storedName = FOLDER + id + "_" + photoFileName;

    if (!await fs.exists(storedName)) {
        throw NOTFOUNDERROR;
    } else if (typeof auth === "undefined" || auth === null) {
        throw AUTHERROR;
    }

    // Check venue exists
    const venueExists = await db.getPool().query("SELECT venue_id, admin_id FROM Venue WHERE venue_id = ?" ,[id]);
    if (typeof venueExists[0] === "undefined") throw NOTFOUNDERROR;

    // Check user is admin of venue
    const user = await db.getPool().query("SELECT user_id FROM User WHERE auth_token = ?", [auth]);
    if (typeof user[0] === "undefined" || user[0]["user_id"] !== venueExists[0]["admin_id"]) throw FORBIDDENERROR;

    //Check if photo is primary
    const isPrimary = await db.getPool().query("SELECT is_primary FROM VenuePhoto WHERE venue_id = ? AND " +
                                                "photo_filename = ?", [id, photoFileName]);

    if (typeof isPrimary !== "undefined" && isPrimary === 1) {
        await db.getPool().query("UPDATE is_primary = 1 WHERE venue_id = ? LIMIT 1", [id]);
    }

    await fs.unlink(storedName);
    return await db.getPool("DELETE FROM VenuePhoto WHERE venue_id = ? AND photo_filename = ?", [id, photoFileName]);
};