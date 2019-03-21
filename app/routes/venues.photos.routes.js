const photos = require('../controllers/venues.photos.controller');

module.exports = function (app) {
    // Venue reviews
    app.route(app.rootUrl + '/venues/:id/photos')
        .post(photos.add)
        .delete(photos.remove);

    app.route(app.rootUrl + '/venues/:id/photos/:photoFilename')
        .get(photos.get);
};
