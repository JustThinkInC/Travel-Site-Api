const db = require('../../config/db');
const fs = require("mz/fs");
const globals = require('../../config/constants');

const PNG = "image/png";
const JPEG = "image/jpeg";
const FOLDER = "app/user.photos/";

// Returns file extension if user has photo
async function photoExension(id) {

    if (await fs.exists(FOLDER+id+".jpeg")) {
        return ".jpeg";
    } else if (await fs.exists(FOLDER+id+".png")) {
        return ".png";
    }

    return "null";
}


// Removes a user's profile photo from server storage
// Does not affect database
function removePhoto(id, extension) {
    fs.unlinkSync(FOLDER+id+extension);
}


// PUT: add profile photo for user
exports.insert = async function(req) {
    const headers = req.headers;
    const body = req.body;
    let auth = headers["x-authorization"];
    let id = req.params.id;
    let user;
    let extension;
    let filename;
    let response = {"message":"Created", "status":201}; //Default response

    //Check authorisation
    if (typeof auth === "undefined" || auth === "" || auth === null) {
        throw globals.AUTH_ERROR;
    } else {
        // Check user exists
        user = await db.getPool().query("SELECT * FROM User WHERE user_id = ?", [id]);
        if (typeof user[0] === "undefined") throw globals.NOT_FOUND_ERROR;
        // If user is not same as logged in, operation is forbidden
        if (user[0]["auth_token"] !== auth) throw globals.FORBIDDEN_ERROR;
    }

    // Set extension of file to write
    if (req.headers["content-type"] === PNG) {
        extension = ".png";
    } else if (req.headers["content-type"] === JPEG) {
        extension = ".jpeg";
    } else {
        throw globals.BAD_REQUEST_ERROR;  //Invalid request
    }

    let existsExtension = await photoExension(id);

    // If file exists, status is 200
    if (existsExtension !== "null") {
        removePhoto(id, existsExtension);
        response = {"message":"OK", "status":200};
    }

    // Set the filename of photo
    filename = user[0]["user_id"]+extension;

    await fs.writeFile(FOLDER + filename, body);
    await db.getPool().query("UPDATE User SET profile_photo_filename = ? WHERE user_id = ?", [[filename], [id]]);

    return response;
};


// GET: a user's profile photo
exports.view = async function(id) {
    let response = {"content":"png", "image":null};

    let extension = await photoExension(id);

    if (extension === "null") {
        throw globals.NOT_FOUND_ERROR;
    }

    response["content"] = extension.substr(1);
    response["image"] = await fs.readFile(FOLDER + id + extension);

    return response;
};


// DELETE user photo
exports.delete =  async function(req) {
    let id = req.params.id;
    let auth = req.headers["x-authorization"];

    // Check auth token exists
    if (typeof auth === "undefined" || auth === "" || auth === null) {
        throw globals.AUTH_ERROR;
    }

    // Check auth token matches user
    let dbAuth = await db.getPool().query("SELECT * FROM User WHERE auth_token = ?", [auth]);
    let extension = await photoExension(id);

    // Check user exists if photo exists
    if (extension === "null") {
        throw globals.NOT_FOUND_ERROR;
    } else if (typeof dbAuth[0] !== "undefined" && dbAuth[0]["user_id"].toString() !== id.toString()) {   // Check authentication matches user
        throw globals.FORBIDDEN_ERROR;
    }
    
    // Delete the photo
    removePhoto(id, extension);

    return await db.getPool().query("UPDATE User SET profile_photo_filename = '' WHERE user_id = ?", [id]);
};