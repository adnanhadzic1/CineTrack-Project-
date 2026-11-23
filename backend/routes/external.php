<?php
// /external - results from TMDB (the external API), fetched by the backend so the access token stays secret.

// Search: /external/titles/search?query=matrix&type=movie&page=1   (type: all, movie or tv; default all)
Flight::route('GET /external/titles/search', function () {
    $page = Flight::request()->query['page'] ?? 1;
    $result = (new TmdbService())->search(textQuery('query') ?? '', textQuery('type') ?? 'all', (int) $page);
    respond($result, 'Search results loaded');
});

// Details of one title: /external/titles/movie/603
Flight::route('GET /external/titles/@mediaType/@tmdbId', function ($mediaType, $tmdbId) {
    respond((new TmdbService())->details($mediaType, Validator::id($tmdbId, 'tmdbId')), 'Title details loaded');
});
