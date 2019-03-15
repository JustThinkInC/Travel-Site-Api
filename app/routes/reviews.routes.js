const reviews = require('../controllers/reviews.controller');

module.exports = function (app) {
    // Venue reviews
    app.route(app.rootUrl + '/venues/:id/reviews')
        .post(reviews.review)
        .get(reviews.view);

    // User reviews
    app.route(app.rootUrl + '/users/:id/reviews')
        .get(reviews.byUser);
};
