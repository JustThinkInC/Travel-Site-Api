const reviews = require('../controllers/reviews.controller');

module.exports = function (app) {
    // Venue reviews
    app.route(app.rootUrl + '/venues/:id/reviews')
        .get(reviews.view)
        .post(reviews.review);

    // User reviews
    app.route(app.rootUrl + '/users/:id/reviews')
        .get(reviews.getUserReviews);
};
