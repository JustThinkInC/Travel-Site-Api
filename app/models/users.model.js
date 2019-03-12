const db = require('../../config/db');

const unimplemented = {"Error" : "Unimplemented"};

exports.insert = async function(body) {
    let info = [body.username, body.email, body.givenName, body.familyName, body.password];
    for(let i=0; i < info.length; i++) {
        if (typeof info[i] === "undefined") throw ("Missing field");
    };

    return await db.getPool().query('INSERT INTO User(username, email, given_name, family_name, password)' +
        ' VALUES ?', [[info]]);
};
