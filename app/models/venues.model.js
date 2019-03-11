const db = require('../../config/db');

const unimplemented = {"Error" : "Unimplemented"};  // Unimplemented error message in JSON

exports.getAll = function(req, res) {
    db.getPool().query("SELECT * FROM Venue WHERE city = ?, ", function(err, rows) {
        if (err) return done(err);
        res.json(rows);
    });
};

exports.insert = function(req, res) {
   res.json(unimplemented);
};

exports.getVenue = function(req, res) {
    res.json(unimplemented);
};

exports.patchVenue = function(req, res) {
    res.json(unimplemented);
}