<?php
// /genres

Flight::route('GET /genres', function () {
    respond((new GenreService())->getAll(), 'Genres loaded');
});

Flight::route('GET /genres/@id', function ($id) {
    respond((new GenreService())->getById(Validator::id($id)), 'Genre loaded');
});

Flight::route('POST /genres', function () {
    respond((new GenreService())->create(jsonBody()), 'Genre created successfully', 201);
});

Flight::route('PUT /genres/@id', function ($id) {
    respond((new GenreService())->update(Validator::id($id), jsonBody()), 'Genre updated successfully');
});

Flight::route('DELETE /genres/@id', function ($id) {
    (new GenreService())->delete(Validator::id($id));
    respond(null, 'Genre deleted successfully');
});
