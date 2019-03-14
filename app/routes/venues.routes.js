const venues = require('../controllers/venues.controller');

module.exports = function (app) {
    // General venues
    app.route(app.rootUrl + '/venues')

        .post(venues.add);//.get(venues.view)

    // Specific venue
    app.route(app.rootUrl + '/venues/:id')
        .get(venues.viewVenue)
        .patch(venues.updateVenue);

    // All info about venue categories
    app.route(app.rootUrl + '/categories')
        .get(venues.categories);
};
