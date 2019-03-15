const users = require('../controllers/users.controller');

module.exports = function (app) {
    // Register a user
    app.route(app.rootUrl + '/users')
        .post(users.register);

    // Login as an existing user
    app.route(app.rootUrl + '/users/login')
        .post(users.login);

    // Logout a logged in user
    app.route(app.rootUrl + '/users/logout')
        .post(users.logout);

    // View or update information about a user
     app.route(app.rootUrl + '/users/:id')
         .get(users.getUser)
        .patch(users.patchUser);
};
