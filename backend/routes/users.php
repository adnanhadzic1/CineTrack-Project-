<?php
// /users - account data. Passwords are never returned.

Flight::route('GET /users', function () {
    respond((new UserService())->getAll(), 'Users loaded');
});

Flight::route('GET /users/@id', function ($id) {
    respond((new UserService())->getById(Validator::id($id)), 'User loaded');
});

Flight::route('POST /users', function () {
    respond((new UserService())->create(jsonBody()), 'User created successfully', 201);
});

Flight::route('PUT /users/@id', function ($id) {
    respond((new UserService())->update(Validator::id($id), jsonBody()), 'User updated successfully');
});

Flight::route('DELETE /users/@id', function ($id) {
    (new UserService())->delete(Validator::id($id));
    respond(null, 'User deleted successfully');
});
