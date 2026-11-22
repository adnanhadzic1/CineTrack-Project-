<?php
// /titles - movies and TV shows. The genres of a title are changed with PUT /titles/@id/genres (see title-genres.php).

Flight::route('GET /titles', function () {
    $titles = (new TitleService())->getAll(textQuery('search'), textQuery('type'), idQuery('genreId'));
    respond($titles, 'Titles loaded');
});

Flight::route('GET /titles/@id', function ($id) {
    respond((new TitleService())->getById(Validator::id($id)), 'Title loaded');
});

Flight::route('POST /titles', function () {
    respond((new TitleService())->create(jsonBody()), 'Title created successfully', 201);
});

Flight::route('PUT /titles/@id', function ($id) {
    respond((new TitleService())->update(Validator::id($id), jsonBody()), 'Title updated successfully');
});

Flight::route('DELETE /titles/@id', function ($id) {
    (new TitleService())->delete(Validator::id($id));
    respond(null, 'Title deleted successfully');
});
