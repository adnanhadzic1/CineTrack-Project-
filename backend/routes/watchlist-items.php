<?php
// /watchlist-items - one user tracking one title. In M3 the user comes from the request (?userId=1 / body);
// in M4 it will come from the login token.

Flight::route('GET /watchlist-items', function () {
    respond((new WatchlistItemService())->getAll(idQuery('userId'), textQuery('status')), 'Watchlist items loaded');
});

Flight::route('GET /watchlist-items/@id', function ($id) {
    respond((new WatchlistItemService())->getById(Validator::id($id)), 'Watchlist item loaded');
});

Flight::route('POST /watchlist-items', function () {
    respond((new WatchlistItemService())->create(jsonBody()), 'Title added to the watchlist', 201);
});

Flight::route('PUT /watchlist-items/@id', function ($id) {
    respond((new WatchlistItemService())->update(Validator::id($id), jsonBody()), 'Watchlist item updated successfully');
});

Flight::route('DELETE /watchlist-items/@id', function ($id) {
    (new WatchlistItemService())->delete(Validator::id($id));
    respond(null, 'Title removed from the watchlist');
});
