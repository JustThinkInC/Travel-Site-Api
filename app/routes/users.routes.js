const users = require('../controllers/users.controller');

module.exports = function (app) {
    // General venues
    app.route(app.rootUrl + '/users')
        .post(users.register);
    //
    // // Specific venue
    // app.route(app.rootUrl + '/users/login')
    //     .post(users.login);
    //
    // // All info about venue categories
    // app.route(app.rootUrl + '/users/logout')
    //     .post(users.logout);
    //
    // app.route(app.rootUrl + '/users/:id')
    //     .get(users.getUser)
    //     .patch(users.patchUser);
};
