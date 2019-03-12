const db = require('../../config/db');

const unimplemented = {"Error" : "Unimplemented"};

exports.insert = function(body, done) {
    let info = [[body.username, body.email, body.givenName, body.familyName, body.password]];
    for(let i=0; i < info.length; i++) {
        if (typeof info[i] === undefined) return done({400:"Bad Request"});
    }

    db.getPool().query('INSERT INTO User(username, email, given_name, family_name, password) VALUES ?', [info], function(err, result) {
            if (err) return done({400:"Bad Request"});

            return done ({201: "Created"});
        });
};
