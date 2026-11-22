<?php
/**
 * Loads everything the API needs. public/index.php requires this file first.
 * The classes are loaded with plain require_once, so no Composer autoload setup is needed for our own code
 * (Composer only installs FlightPHP into vendor/).
 */
require_once __DIR__ . '/vendor/autoload.php';

require_once __DIR__ . '/config/Config.php';
require_once __DIR__ . '/config/Database.php';

foreach (['User', 'Title', 'Genre', 'TitleGenre', 'WatchlistItem', 'Review'] as $name) {
    require_once __DIR__ . "/services/{$name}Service.php";   // each service loads the DAOs it needs
}
require_once __DIR__ . '/services/TmdbService.php';
