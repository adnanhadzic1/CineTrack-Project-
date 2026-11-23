<?php
// /reviews

Flight::route('GET /reviews', function () {
    respond((new ReviewService())->getAll(idQuery('userId'), idQuery('titleId')), 'Reviews loaded');
});

Flight::route('GET /reviews/@id', function ($id) {
    respond((new ReviewService())->getById(Validator::id($id)), 'Review loaded');
});

Flight::route('POST /reviews', function () {
    respond((new ReviewService())->create(jsonBody()), 'Review created successfully', 201);
});

Flight::route('PUT /reviews/@id', function ($id) {
    respond((new ReviewService())->update(Validator::id($id), jsonBody()), 'Review updated successfully');
});

Flight::route('DELETE /reviews/@id', function ($id) {
    (new ReviewService())->delete(Validator::id($id));
    respond(null, 'Review deleted successfully');
});
