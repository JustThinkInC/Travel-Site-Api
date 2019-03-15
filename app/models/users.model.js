const db = require('../../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const AUTHERROR = {name:"Unauthorized", message:"Unauthorized"};
const NOTFOUNDERROR = {name:"Not Found", message:"Not Found"};
const FORBIDDENERROR = {name:"Forbidden", message:"Forbidden"};
const BADREQUESTERROR = {name:"Bad Request", message:"Bad Request"};

const WORKLOAD = 12; // Workload for BCrypt salt

const unimplemented = {"Error" : "Unimplemented"};

// POST: add a user to the database
exports.insert = async function(body) {
    let info = [body.username, body.email, body.givenName, body.familyName, body.password];

    // Check for non passed values
    for(let i=0; i < info.length; i++) {
        if (typeof info[i] === "undefined") throw ("Missing field");
    };

    // Verify email, credit to https://stackoverflow.com/questions/46155/how-to-validate-an-email-address-in-javascript
    let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!re.test(String(body.email).toLowerCase())) {
        throw ("Invalid Email");
    } else if (body.password === ' ' || body.password.length < 1) {
        throw ("Empty Password");
    }

    // Hash password
    let salt = bcrypt.genSaltSync(12);
    let hash = bcrypt.hashSync(body.password, salt);

    // Replace plaint text password with hash
    info[info.length - 1] = hash;

    return await db.getPool().query('INSERT INTO User(username, email, given_name, family_name, password)' +
        ' VALUES ?', [[info]]);
};


// POST login an existing user
exports.authorise = async function(body) {
    let username = body.username;
    let email = body.email;
    let password = body.password;
    let auth;   // This will be a JSON object holding the username/email

    // Check for non-empty
    if (typeof password === "undefined") {
        throw ("Missing password");
    } else if (typeof username === "undefined") {
        if (typeof email === "undefined") {
            throw ("No username or email");
        } else {
            auth = {"email" : email};
        }
    } else {
        auth = {"username" : username};
    }

    let result = await db.getPool().query('SELECT user_id, password FROM User WHERE ?', auth);

    // Set the userId and password hash
    const userId = result[0]["user_id"];
    const hash = result[0]["password"];

    // Compare password with hash
    const valid = await bcrypt.compare(password, hash);
    if (valid) {
        // Generate token
        const token = crypto.randomBytes(16).toString('hex');
        // Save token to database
        await db.getPool().query("UPDATE User SET auth_token = ? WHERE user_id = ?", [token, userId]);

        return {"userId" : userId, "token" : token};
    }
    throw ("Invalid login");
};


// POST log out an existing user
exports.logout = async function(headers) {
    const token = headers["x-authorization"];

    // Check token exists
    if (token === 'undefined' || token === '' || token === null) throw ("Missing authorisation token");

    // Delete token if it is found
    const rows = await db.getPool().query('UPDATE User SET auth_token = "" WHERE auth_token = ?', [token]);

    // If no rows have been changed, then no one was logged in
    if (rows["affectedRows"] === 0) throw ("Token does not match any users");
    return;
};


// GET view a specific users details
exports.get = async function(req) {
    const token = req.headers["x-authorization"];
    const id = req.params.id;
    let showEmail = false;

    // User details
    let details = (await db.getPool().query('SELECT username, email, given_name, family_name, auth_token ' +
        'FROM User WHERE user_id = ?', [id]))[0];

    if (token === '' || details["auth_token"] === null || details["auth_token"] !== token) {
        delete details["email"];
    }
    delete details["auth_token"];

    // Change key values to match expected JSON camel case
    details["givenName"] = details["given_name"];
    delete details["given_name"];
    details["familyName"] = details["family_name"];
    delete details.family_name;

    return details;
};

// PATCH (update) a specific user's details
exports.patchUser = async function(req) {
    const body = req.body;
    let id = req.params.id;
    let auth = req.headers["x-authorization"];
    let user;

    // Check authorisation
    if (typeof auth === "undefined" || auth === "" || auth === null) {
        throw AUTHERROR;
    } else {
        // Check user exists
        user = await db.getPool().query("SELECT * FROM User WHERE user_id = ?", [id]);
        if (typeof user[0] === "undefined") throw NOTFOUNDERROR;
        // If user is not same as logged in, operation is forbidden
        if (typeof user[0] === "undefined" || user[0]["auth_token"] !== auth) throw FORBIDDENERROR;
    }

    // Updated information
    let info = {"username":body["userName"], "email":body["email"], "given_name":body["givenName"],
        "family_name":body["familyName"], "password":body["password"]};

    // Check information exists
    for(let key in info) {
        if (typeof info[key] === "undefined" || info[key] === null) delete info[key];
        if (key == "password" && typeof info[key] === "number") throw BADREQUESTERROR;
    }

    if (Object.keys(info).length === 0) throw BADREQUESTERROR;

    return await db.getPool().query("UPDATE User SET ? WHERE user_id = ?", [info, id]);
};
