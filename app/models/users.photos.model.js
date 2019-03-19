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

// POST: add a user to the database
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
    if (req.headers["content-type"] == PNG) {
        extension = ".png";
    } else if (req.headers["content-type"] == JPEG) {
        extension = ".jpeg";
    } else {
        throw BADREQUESTERROR;  //Invalid request
    }
    // Set the filename of photo
    filename = user[0]["user_id"]+extension;

    // If file exists, status is 200
    if (typeof user[0] !== "undefined" && user[0]["profile_photo_filename"]) {
        console.log("PHOTO FOUND. OVERWRITING");
        fs.writeFileSync(FOLDER + filename, req.body);
        response = {"message":"OK", "status":200};
    }
    console.log("AFTER IF " + response["status"]);
    // File doesn't exist, status is 201
    fs.writeFileSync(FOLDER + filename, req.body);
    await db.getPool().query("UPDATE User SET profile_photo_filename = ? WHERE user_id = ?", [[filename], [id]]);

    return response;
};


// POST: add a user to the database
exports.view = async function(id) {
    let response = {"content":"png", "image":null};

    // let user_photo = await db.getPool().query("SELECT profile_photo_filename FROM User WHERE user_id = ?", [id]);
    // console.log(user_photo);
    // user_photo = user_photo[0]["profile_photo_filename"];


    // If file exists, status is 200
    if (fs.existsSync(FOLDER+id+".jpeg")) {
        response["content"] = "jpeg";
        response["image"] = fs.readFileSync(FOLDER+id+".jpeg");
        console.log("GETTING JPEG")
    } else if (fs.existsSync(FOLDER+id+".png")) {
        response["image"] = fs.readFileSync(FOLDER + id + ".png");
        console.log("GETTING PNG")
    } else {
        throw NOTFOUNDERROR;
    }

    console.log("GET NO ERROR");

    return response;
};
