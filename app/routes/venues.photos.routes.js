const photos = require('../controllers/venues.photos.controller');

module.exports = function (app) {
    // Venue reviews
    app.route(app.rootUrl + '/venues/:id/photos')
//        .get(photos.get)
        .post(photos.add);
  //      .delete(photos.remove);
};
