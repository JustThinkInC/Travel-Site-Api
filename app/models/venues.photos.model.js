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
    const description = req.body["description\n"];
    let makePrimary = req.body["makePrimary\n"];
    let photoData = req.file;
    let user;

    // Bad request if no photo
    if (typeof photoData === "undefined") throw BADREQUESTERROR;

    // Check valid description and make primary fields
    if (typeof description === "undefined" || description === null) throw BADREQUESTERROR;
    console.log("23");
    if (typeof makePrimary === "undefined" || !(makePrimary !== "true "|| makePrimary !== "false")) throw BADREQUESTERROR;
    console.log("over");
    // console.log(id);
    // console.log(description);
    // console.log(isPrimary);
    // console.log(photoData);
    // console.log(req.body);

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
    console.log(photoData);

    // Save the file to the venue photos' folder
    try {
        fs.writeFileSync(newFileName, binary);
    } catch (e) {
        console.log(e);
    }

    if (makePrimary === "true") {
        await db.getPool().query("UPDATE VenuePhoto SET is_primary = false WHERE is_primary = true");
        makePrimary = 1;
    } else {
        makePrimary = 0;
    }
    console.log("LINE 59");
    // If venue doesn't have primary photo, make this photo primary
    let hasPrimary = await db.getPool().query("SELECT * FROM VenuePhoto WHERE is_primary = true");
    if (typeof hasPrimary[0] === "undefined") {
        makePrimary = 1;
    }
    console.log("LINE 65");
    let info = [id, newFileName.substring(FOLDER.length).toString(), description.toString(), makePrimary];
    console.log("ADDING VENUE PHOTO TO DATABASE");
    return await db.getPool().query('INSERT INTO VenuePhoto(venue_id, photo_filename, photo_description, is_primary) ' +
                                    'VALUES ?', [[info]]);
};