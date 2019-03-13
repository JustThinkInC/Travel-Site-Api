const db = require('../../config/db');
const bcrypt = require('bcryptjs');
const WORKLOAD = 12; // Workload for BCrypt salt

const unimplemented = {"Error" : "Unimplemented"};

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
