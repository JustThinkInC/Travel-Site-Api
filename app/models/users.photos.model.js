const db = require('../../config/db');
const bodyParser = require("body-parser");
const fs = require("fs");

const AUTHERROR = {name:"Unauthorized", message:"Unauthorized"};
const NOTFOUNDERROR = {name:"Not Found", message:"Not Found"};
const FORBIDDENERROR = {name:"Forbidden", message:"Forbidden"};
const BADREQUESTERROR = {name:"Bad Request", message:"Bad Request"};
const PNG = "image/png";
const JPEG = "image/jpeg";
const FOLDER = "app/user.photos/";

// Returns file extension if user has photo
function photoExension(id) {

    if (fs.existsSync(FOLDER+id+".jpeg")) {
        return ".jpeg";
    } else if (fs.existsSync(FOLDER+id+".png")) {
        return ".png";
    }

    return null;
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
        throw AUTHERROR;
    } else {
        // Check user exists
        user = await db.getPool().query("SELECT * FROM User WHERE user_id = ?", [id]);
        if (typeof user[0] === "undefined") throw NOTFOUNDERROR;
        // If user is not same as logged in, operation is forbidden
        if (user[0]["auth_token"] !== auth) throw FORBIDDENERROR;
    }

    // Set extension of file to write
    if (req.headers["content-type"] === PNG) {
        extension = ".png";
    } else if (req.headers["content-type"] === JPEG) {
        extension = ".jpeg";
    } else {
        throw BADREQUESTERROR;  //Invalid request
    }

    let existsExtension = photoExension(id);

    // Set the filename of photo
    filename = user[0]["user_id"]+extension;

    // If file exists, status is 200
    if (existsExtension !== null) {
        removePhoto(id, existsExtension);
        fs.writeFileSync(FOLDER + filename, req.body);
        response = {"message":"OK", "status":200};
    }

    // File doesn't exist, status is 201
    fs.writeFileSync(FOLDER + filename, req.body);
    await db.getPool().query("UPDATE User SET profile_photo_filename = ? WHERE user_id = ?", [[filename], [id]]);

    return response;
};


// GET: a user's profile photo
exports.view = async function(id) {
    let response = {"content":"png", "image":null};

    let extension = photoExension(id);

    if (extension === null) {
        throw NOTFOUNDERROR;
    }

    response["content"] = extension.substr(1);
    response["image"] = fs.readFileSync(FOLDER + id + extension);

    return response;
};


// DELETE user photo
exports.delete =  async function(req) {
    let id = req.params.id;
    let auth = req.headers["x-authorization"];

    // Check auth token exists
    if (typeof auth === "undefined" || auth === "" || auth === null) {
        throw AUTHERROR;
    }

    // Check auth token matches user
    let dbAuth = await db.getPool().query("SELECT * FROM User WHERE auth_token = ?", [auth]);
    let extension = photoExension(id);

    // Check user exists if photo exists
    if (!extension) {
        throw NOTFOUNDERROR;
    } else if (typeof dbAuth[0] !== "undefined" && dbAuth[0]["user_id"].toString() !== id.toString()) {   // Check authentication matches user
        throw FORBIDDENERROR;
    }
    console.log(dbAuth[0]);
    // Delete the photo
    removePhoto(id, extension);

    return await db.getPool().query("UPDATE User SET profile_photo_filename = '' WHERE user_id = ?", [id]);
};