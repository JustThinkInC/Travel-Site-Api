const db = require('../../config/db');

exports.getAll = function(req, res) {
    db.getPool().query("SELECT * FROM Venue WHERE city = ?, ", function(err, rows) {
        if (err) return done(err);
        res.json(rows);
    });
};