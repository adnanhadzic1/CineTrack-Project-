<?php
// /title-genres - the link table between titles and genres. A link has no id: it is the pair (titleId, genreId).

Flight::route('GET /title-genres', function () {
    respond((new TitleGenreService())->getAll(idQuery('titleId'), idQuery('genreId')), 'Title-genre links loaded');
});

Flight::route('POST /title-genres', function () {
    respond((new TitleGenreService())->add(jsonBody()), 'Genre added to the title', 201);
});

Flight::route('DELETE /title-genres/@titleId/@genreId', function ($titleId, $genreId) {
    (new TitleGenreService())->remove(Validator::id($titleId, 'titleId'), Validator::id($genreId, 'genreId'));
    respond(null, 'Genre removed from the title');
});

// Replace all genres of one title at once: {"genreIds": [1, 4]}
Flight::route('PUT /titles/@titleId/genres', function ($titleId) {
    respond((new TitleGenreService())->replaceForTitle(Validator::id($titleId, 'titleId'), jsonBody()), 'Genres of the title updated successfully');
});
