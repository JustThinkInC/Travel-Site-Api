const photos = require('../controllers/users.photos.controller');

module.exports = function (app) {
    // Venue reviews
    app.route(app.rootUrl + '/users/:id/photo')
        .get(photos.get)
        .put(photos.add)
        .delete(photos.remove);
};
