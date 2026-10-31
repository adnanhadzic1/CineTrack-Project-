# dao/ – Data Access Objects (Milestone 2)

`BaseDao.php` holds the shared PDO code and generic CRUD. One class per table extends it:

| Class | Table | Extra methods |
|-------|-------|---------------|
| `UserDao` | users | `findByEmail`, `findByEmailWithPasswordHash` (login only), `updatePasswordHash` |
| `TitleDao` | titles | `findByTmdbId`, `search`, `findByGenreId` |
| `GenreDao` | genres | `findByName`, `findByTitleId` |
| `TitleGenreDao` | title_genres (junction) | `add`, `exists`, `findByTitleId`, `findByGenreId`, `remove`, `replaceForTitle` (transaction) |
| `WatchlistItemDao` | watchlist_items | `findByUserId`, `findByUserAndTitle`, `countByStatus` |
| `ReviewDao` | reviews | `findByUserId`, `findByTitleId`, `findByUserAndTitle`, `averageRatingForTitle` |

Only DAOs contain SQL. They are called by services (M3), never by routes or the frontend.
