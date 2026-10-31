<?php
/**
 * Plain PHP check of the database and the DAO classes (no test framework needed).
 *
 * Run from the project root, after importing database/cinetrack.sql and creating backend/config/config.php:
 *     php backend/tests/dao_test.php
 *
 * The script creates its own test rows and deletes them again at the end, so the sample data stays unchanged.
 * (If it is stopped halfway, re-import database/cinetrack.sql to get a clean database.)
 * Exit code 0 = all checks passed, 1 = at least one failed.
 */
require_once __DIR__ . '/../dao/UserDao.php';
require_once __DIR__ . '/../dao/TitleDao.php';
require_once __DIR__ . '/../dao/GenreDao.php';
require_once __DIR__ . '/../dao/TitleGenreDao.php';
require_once __DIR__ . '/../dao/WatchlistItemDao.php';
require_once __DIR__ . '/../dao/ReviewDao.php';

$passed = 0;
$failed = 0;

function check(string $name, bool $condition): void
{
    global $passed, $failed;
    if ($condition) { $passed++; echo "  ok    $name\n"; } else { $failed++; echo "  FAIL  $name\n"; }
}

/** True when running $action throws an exception of the given class (and, if given, with this SQLSTATE code). */
function throws(callable $action, string $class = Throwable::class, ?string $sqlState = null): bool
{
    try {
        $action();
    } catch (Throwable $e) {
        if (!($e instanceof $class)) { return false; }
        return $sqlState === null || (string) $e->getCode() === $sqlState;
    }
    return false;
}

$db = Database::connect();
$users = new UserDao($db);
$titles = new TitleDao($db);
$genres = new GenreDao($db);
$titleGenres = new TitleGenreDao($db);
$watchlist = new WatchlistItemDao($db);
$reviews = new ReviewDao($db);

echo "Schema\n";
$tableNames = array_column($db->query("SELECT table_name AS t FROM information_schema.tables WHERE table_schema = DATABASE()")->fetchAll(), 't');
foreach (['users', 'titles', 'genres', 'title_genres', 'watchlist_items', 'reviews'] as $table) {
    check("table $table exists", in_array($table, array_map('strtolower', $tableNames), true));
}
$engines = array_column($db->query("SELECT DISTINCT engine AS e FROM information_schema.tables WHERE table_schema = DATABASE()")->fetchAll(), 'e');
check('all tables use InnoDB', $engines === ['InnoDB']);
$foreignKeys = (int) $db->query("SELECT COUNT(*) FROM information_schema.referential_constraints WHERE constraint_schema = DATABASE()")->fetchColumn();
check('6 foreign keys exist', $foreignKeys === 6);
$cascades = (int) $db->query("SELECT COUNT(*) FROM information_schema.referential_constraints WHERE constraint_schema = DATABASE() AND delete_rule = 'CASCADE'")->fetchColumn();
check('all 6 foreign keys delete with CASCADE', $cascades === 6);
$uniques = $db->query("SELECT DISTINCT index_name AS i FROM information_schema.statistics WHERE table_schema = DATABASE() AND non_unique = 0 AND index_name <> 'PRIMARY'")->fetchAll();
check('unique constraints exist (email, genre name, tmdb, watchlist, review)', count($uniques) === 5);
$sampleUsers = $users->findAll();
check('sample data: 5 users, 14 titles, 12 genres', count($sampleUsers) === 5 && count($titles->findAll()) === 14 && count($genres->findAll()) === 12);
$hashes = (int) $db->query("SELECT COUNT(*) FROM users WHERE password_hash LIKE '\$2y\$%'")->fetchColumn();
check('sample passwords are stored as bcrypt hashes', $hashes === 5);

$extraTitleIds = [];   // titles the script creates without deleting them in a test; removed at the end
try {
    echo "\nUserDao\n";
    $quoteName = "Test O'Brien \"Q\"; DROP TABLE users;--";
    $userId = $users->create(['name' => $quoteName, 'email' => 'dao.test@example.com', 'password_hash' => password_hash('x', PASSWORD_BCRYPT)]);
    check('create returns a new id', $userId > 0);
    $user = $users->findById($userId);
    check('read by id returns the row (quotes and SQL text stored as plain text)', $user !== null && $user['name'] === $quoteName);
    check('default role is user and is_active is 1', $user['role'] === 'user' && (int) $user['is_active'] === 1);
    check('findById does not return password_hash', !array_key_exists('password_hash', $user));
    check('findAll does not return password_hash', !array_key_exists('password_hash', $users->findAll()[0]));
    check('findByEmail finds the user without the hash', ($users->findByEmail('dao.test@example.com')['id'] ?? null) == $userId && !array_key_exists('password_hash', $users->findByEmail('dao.test@example.com')));
    check('findByEmailWithPasswordHash returns a verifiable hash', password_verify('x', $users->findByEmailWithPasswordHash('dao.test@example.com')['password_hash']));
    check('users table still exists after the "DROP TABLE" text', count($users->findAll()) === 6);
    check('update returns true and changes the row', $users->update($userId, ['name' => 'Renamed', 'role' => 'admin']) === true && $users->findById($userId)['role'] === 'admin');
    check('update of a missing id returns false', $users->update(999999, ['name' => 'x']) === false);
    check('updatePasswordHash stores a new hash', $users->updatePasswordHash($userId, password_hash('y', PASSWORD_BCRYPT)) && password_verify('y', $users->findByEmailWithPasswordHash('dao.test@example.com')['password_hash']));
    check('duplicate e-mail is rejected (unique)', throws(fn () => $users->create(['name' => 'Dup', 'email' => 'dao.test@example.com', 'password_hash' => 'h']), PDOException::class, '23000'));
    check('invalid role is rejected by the ENUM', throws(fn () => $users->create(['name' => 'Bad', 'email' => 'bad.role@example.com', 'password_hash' => 'h', 'role' => 'superuser']), PDOException::class));
    check('a column that is not allowed is rejected', throws(fn () => $users->update($userId, ['id' => 1]), InvalidArgumentException::class));
    check('an unknown column name cannot be injected', throws(fn () => $users->create(['name) VALUES (1); --' => 'x']), InvalidArgumentException::class));
    check('empty data is rejected', throws(fn () => $users->update($userId, []), InvalidArgumentException::class));

    echo "\nTitleDao and GenreDao\n";
    $titleId = $titles->create(['tmdb_id' => 4242, 'media_type' => 'movie', 'title' => "Rock 'n' Roll 100%", 'release_date' => '2026-01-02']);
    check('title create + read by id', $titles->findById($titleId)['title'] === "Rock 'n' Roll 100%");
    check('findByTmdbId finds it', ($titles->findByTmdbId(4242, 'movie')['id'] ?? null) == $titleId);
    $extraTitleIds[] = $tvId = $titles->create(['tmdb_id' => 4242, 'media_type' => 'tv', 'title' => 'Same id, other type']);
    check('the same tmdb_id as a tv show is allowed (media type differs)', $tvId > 0);
    check('the same tmdb_id and media type twice is rejected', throws(fn () => $titles->create(['tmdb_id' => 4242, 'media_type' => 'movie', 'title' => 'Dup']), PDOException::class, '23000'));
    $nullOne = $titles->create(['tmdb_id' => null, 'media_type' => 'movie', 'title' => 'No TMDB one']);
    $nullTwo = $titles->create(['tmdb_id' => null, 'media_type' => 'movie', 'title' => 'No TMDB two']);
    $extraTitleIds[] = $nullOne;
    $extraTitleIds[] = $nullTwo;
    check('several titles without tmdb_id are allowed', $nullOne > 0 && $nullTwo > 0);
    check('invalid media type is rejected', throws(fn () => $titles->create(['media_type' => 'book', 'title' => 'x']), PDOException::class));
    check('search finds by part of the name', count($titles->search('Orbit')) === 1);
    check('search with a quote works', count($titles->search("Rock 'n'")) === 1);
    check('search treats % as a normal character', count($titles->search('100%')) === 1 && count($titles->search('%')) === 1);
    check('search can filter by media type', count($titles->search('Orbit', 'movie')) === 0 && count($titles->search('Orbit', 'tv')) === 1);
    check('title update', $titles->update($titleId, ['title' => 'Renamed title']) && $titles->findById($titleId)['title'] === 'Renamed title');

    $genreId = $genres->create(['name' => 'Test Genre']);
    check('genre create + read', $genres->findById($genreId)['name'] === 'Test Genre' && $genres->findByName('Test Genre')['id'] == $genreId);
    check('duplicate genre name is rejected', throws(fn () => $genres->create(['name' => 'Test Genre']), PDOException::class, '23000'));
    check('genre update', $genres->update($genreId, ['name' => 'Test Genre 2']) && $genres->findById($genreId)['name'] === 'Test Genre 2');

    echo "\nTitleGenreDao (many-to-many)\n";
    $titleGenres->add($titleId, $genreId);
    check('add + exists', $titleGenres->exists($titleId, $genreId));
    check('the same genre twice on a title is rejected', throws(fn () => $titleGenres->add($titleId, $genreId), PDOException::class, '23000'));
    check('genre that does not exist is rejected (foreign key)', throws(fn () => $titleGenres->add($titleId, 999999), PDOException::class, '23000'));
    check('title that does not exist is rejected (foreign key)', throws(fn () => $titleGenres->add(999999, $genreId), PDOException::class, '23000'));
    check('GenreDao::findByTitleId and TitleDao::findByGenreId follow the link', $genres->findByTitleId($titleId)[0]['id'] == $genreId && $titles->findByGenreId($genreId)[0]['id'] == $titleId);
    check('findByTitleId / findByGenreId return the pair', count($titleGenres->findByTitleId($titleId)) === 1 && count($titleGenres->findByGenreId($genreId)) === 1);
    $titleGenres->replaceForTitle($titleId, [1, 2, 2]);
    check('replaceForTitle swaps the whole list (duplicates in the list are ignored)', array_column($titleGenres->findByTitleId($titleId), 'genre_id') == [1, 2]);
    check('replaceForTitle with a bad genre rolls everything back', throws(fn () => $titleGenres->replaceForTitle($titleId, [3, 999999]), PDOException::class) && array_column($titleGenres->findByTitleId($titleId), 'genre_id') == [1, 2]);
    check('remove returns true once, then false', $titleGenres->remove($titleId, 1) === true && $titleGenres->remove($titleId, 1) === false);
    check('findAll works for the junction table', count($titleGenres->findAll()) > 20);
    check('single-id methods are refused on the junction table', throws(fn () => $titleGenres->findById(1), LogicException::class) && throws(fn () => $titleGenres->delete(1), LogicException::class));

    echo "\nWatchlistItemDao\n";
    $itemId = $watchlist->create(['user_id' => $userId, 'title_id' => $titleId, 'status' => 'watching', 'progress_pct' => 40, 'progress_note' => "S1 'E4'"]);
    $item = $watchlist->findById($itemId);
    check('create + read', $item['status'] === 'watching' && (int) $item['progress_pct'] === 40 && $item['progress_note'] === "S1 'E4'");
    check('defaults: status planned, progress 0', ($d = $watchlist->findById($watchlist->create(['user_id' => $userId, 'title_id' => $nullOne]))) && $d['status'] === 'planned' && (int) $d['progress_pct'] === 0);
    check('findByUserId and the status filter', count($watchlist->findByUserId($userId)) === 2 && count($watchlist->findByUserId($userId, 'watching')) === 1 && count($watchlist->findByUserId($userId, 'completed')) === 0);
    check('findByUserAndTitle finds it, or null', ($watchlist->findByUserAndTitle($userId, $titleId)['id'] ?? null) == $itemId && $watchlist->findByUserAndTitle($userId, $nullTwo) === null);
    check('countByStatus', $watchlist->countByStatus($userId) === ['planned' => 1, 'watching' => 1, 'completed' => 0]);
    check('the same title twice for one user is rejected', throws(fn () => $watchlist->create(['user_id' => $userId, 'title_id' => $titleId]), PDOException::class, '23000'));
    check('another user may add the same title', is_int($watchlist->create(['user_id' => 1, 'title_id' => $titleId])));
    check('unknown user is rejected (foreign key)', throws(fn () => $watchlist->create(['user_id' => 999999, 'title_id' => $titleId]), PDOException::class, '23000'));
    check('unknown title is rejected (foreign key)', throws(fn () => $watchlist->create(['user_id' => $userId, 'title_id' => 999999]), PDOException::class, '23000'));
    check('progress above 100 is rejected (CHECK)', throws(fn () => $watchlist->update($itemId, ['progress_pct' => 101]), PDOException::class));
    check('invalid status is rejected (ENUM)', throws(fn () => $watchlist->update($itemId, ['status' => 'abandoned']), PDOException::class));
    check('update status and progress', $watchlist->update($itemId, ['status' => 'completed', 'progress_pct' => 100]) && $watchlist->findById($itemId)['status'] === 'completed');
    check('updating a row to the same values still counts as found', $watchlist->update($itemId, ['status' => 'completed']) === true);

    echo "\nReviewDao\n";
    $text = "Loved it! It's \"great\" -- 100% back\\slash; ünïcödé ✓";
    $reviewId = $reviews->create(['user_id' => $userId, 'title_id' => $titleId, 'rating' => 5, 'body' => $text]);
    check('create + read with quotes, backslash and unicode', $reviews->findById($reviewId)['body'] === $text);
    check('findByUserAndTitle', ($reviews->findByUserAndTitle($userId, $titleId)['id'] ?? null) == $reviewId);
    check('findByUserId', count($reviews->findByUserId($userId)) === 1);
    check('findByTitleId joins the author name only', ($reviews->findByTitleId($titleId)[0]['user_name'] ?? null) === 'Renamed' && !array_key_exists('email', $reviews->findByTitleId($titleId)[0]));
    $reviews->create(['user_id' => 1, 'title_id' => $titleId, 'rating' => 2, 'body' => 'Not for me.']);
    check('averageRatingForTitle', $reviews->averageRatingForTitle($titleId) === 3.5 && $reviews->averageRatingForTitle($nullTwo) === null);
    check('a second review of the same title by the same user is rejected', throws(fn () => $reviews->create(['user_id' => $userId, 'title_id' => $titleId, 'rating' => 1, 'body' => 'again']), PDOException::class, '23000'));
    check('rating 0 and rating 6 are rejected (CHECK)', throws(fn () => $reviews->create(['user_id' => $userId, 'title_id' => $nullOne, 'rating' => 0, 'body' => 'x']), PDOException::class) && throws(fn () => $reviews->create(['user_id' => $userId, 'title_id' => $nullOne, 'rating' => 6, 'body' => 'x']), PDOException::class));
    check('empty body is a NOT NULL violation when missing', throws(fn () => $reviews->create(['user_id' => $userId, 'title_id' => $nullOne, 'rating' => 3]), PDOException::class));
    check('unknown user / title are rejected (foreign key)', throws(fn () => $reviews->create(['user_id' => 999999, 'title_id' => $titleId, 'rating' => 3, 'body' => 'x']), PDOException::class, '23000') && throws(fn () => $reviews->create(['user_id' => $userId, 'title_id' => 999999, 'rating' => 3, 'body' => 'x']), PDOException::class, '23000'));
    check('review update', $reviews->update($reviewId, ['rating' => 4, 'body' => 'Changed my mind.']) && $reviews->findById($reviewId)['rating'] == 4);

    echo "\nDelete rules (ON DELETE CASCADE)\n";
    check('deleting a genre removes only its title_genres rows, the title stays', $genres->delete($genreId) === true && $titleGenres->findByGenreId($genreId) === [] && $titles->findById($titleId) !== null);
    check('deleting a title removes its watchlist items, reviews and genre links', $titles->delete($titleId) === true
        && $watchlist->findById($itemId) === null && $reviews->findById($reviewId) === null && $titleGenres->findByTitleId($titleId) === []);
    check('deleting a user removes their watchlist and reviews', ($pre = $watchlist->findByUserId($userId)) !== [] && $users->delete($userId) === true && $watchlist->findByUserId($userId) === [] && $reviews->findByUserId($userId) === []);
    check('delete of a missing id returns false', $users->delete($userId) === false && $titles->delete(999999) === false);
    check('other users data was not touched', count($reviews->findByUserId(1)) === 3 && count($watchlist->findByUserId(1)) === 8);

    echo "\nTransaction control\n";
    check('no transaction is left open after the DAO methods', !$db->inTransaction());
} finally {
    foreach ($extraTitleIds as $id) { $titles->delete($id); }
    if ($db->inTransaction()) { $db->rollBack(); }
}

check('test rows were removed (5 users, 14 titles, 12 genres, 12 watchlist items, 6 reviews)',
    count($users->findAll()) === 5 && count($titles->findAll()) === 14 && count($genres->findAll()) === 12
    && (int) $db->query('SELECT COUNT(*) FROM watchlist_items')->fetchColumn() === 12 && (int) $db->query('SELECT COUNT(*) FROM reviews')->fetchColumn() === 6
    && (int) $db->query('SELECT COUNT(*) FROM title_genres')->fetchColumn() === 25);

echo "\nConnection errors\n";
$secret = 'S3cret-Pass-Should-Not-Leak';
$message = '';
$previousLog = ini_set('error_log', '/dev/null');
try {
    Database::createConnection(['host' => '127.0.0.1', 'port' => 3306, 'name' => 'cinetrack', 'user' => 'no_such_user', 'password' => $secret, 'charset' => 'utf8mb4']);
} catch (RuntimeException $e) {
    $message = $e->getMessage();
}
ini_set('error_log', $previousLog === false ? '' : $previousLog);
check('a wrong login throws a generic error', $message === 'Could not connect to the database.');
check('the error message does not contain the password, user or host', !str_contains($message, $secret) && !str_contains($message, 'no_such_user') && !str_contains($message, '127.0.0.1'));
check('PDO is in exception mode and uses real prepared statements', $db->getAttribute(PDO::ATTR_ERRMODE) === PDO::ERRMODE_EXCEPTION && (int) $db->getAttribute(PDO::ATTR_EMULATE_PREPARES) === 0);
check('connection uses utf8mb4', $db->query("SELECT @@character_set_client")->fetchColumn() === 'utf8mb4');

echo "\n$passed passed, $failed failed\n";
exit($failed === 0 ? 0 : 1);
