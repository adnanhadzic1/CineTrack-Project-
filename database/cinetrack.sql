-- =====================================================================================
-- CineTrack database (Milestone 2): structure + sample data
--
-- Import (creates the database `cinetrack` if needed; safe to run again, it rebuilds the tables):
--     mysql -u <your_user> -p < database/cinetrack.sql
--
-- Needs MySQL 8.0.16 or newer (older versions accept CHECK constraints but ignore them).
-- It was also tested on MariaDB 10.11.
--
-- ALL SAMPLE DATA IS FICTIONAL. Titles, people and e-mail addresses are invented (example.com).
-- The five sample users share one demo password for LOCAL TESTING ONLY: CineTrack-demo-1
-- Only the bcrypt hash is stored. Nobody can log in yet: authentication is built in Milestone 4.
-- Never reuse this password and never import this sample data into a public server.
-- =====================================================================================

CREATE DATABASE IF NOT EXISTS cinetrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cinetrack;
SET NAMES utf8mb4;

-- Drop in reverse dependency order so the file can be imported repeatedly.
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS watchlist_items;
DROP TABLE IF EXISTS title_genres;
DROP TABLE IF EXISTS genres;
DROP TABLE IF EXISTS titles;
DROP TABLE IF EXISTS users;

-- ---------- Structure (same as database/erd/erd.md) ----------

CREATE TABLE users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(60)  NOT NULL,
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE titles (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  tmdb_id      INT UNSIGNED NULL,                      -- NULL = added by hand, not from TMDB
  media_type   ENUM('movie', 'tv') NOT NULL,
  title        VARCHAR(200) NOT NULL,
  release_date DATE         NULL,
  poster_path  VARCHAR(255) NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  -- TMDB reuses ids for movies and TV shows, so both columns together are unique.
  -- Several rows with tmdb_id NULL are allowed (NULLs do not clash in a unique index).
  UNIQUE KEY uq_titles_tmdb (tmdb_id, media_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE genres (
  id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(40)  NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_genres_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Junction table: the composite primary key also prevents the same genre twice on one title.
CREATE TABLE title_genres (
  title_id INT UNSIGNED NOT NULL,
  genre_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (title_id, genre_id),
  KEY idx_title_genres_genre (genre_id),
  CONSTRAINT fk_title_genres_title FOREIGN KEY (title_id) REFERENCES titles (id) ON DELETE CASCADE,
  CONSTRAINT fk_title_genres_genre FOREIGN KEY (genre_id) REFERENCES genres (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE watchlist_items (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED NOT NULL,
  title_id      INT UNSIGNED NOT NULL,
  status        ENUM('planned', 'watching', 'completed') NOT NULL DEFAULT 'planned',
  progress_pct  TINYINT UNSIGNED NOT NULL DEFAULT 0,
  progress_note VARCHAR(100) NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_watchlist_user_title (user_id, title_id),   -- one entry per user and title
  KEY idx_watchlist_title (title_id),
  KEY idx_watchlist_user_status (user_id, status),
  CONSTRAINT chk_watchlist_progress CHECK (progress_pct BETWEEN 0 AND 100),
  CONSTRAINT fk_watchlist_user  FOREIGN KEY (user_id)  REFERENCES users (id)  ON DELETE CASCADE,
  CONSTRAINT fk_watchlist_title FOREIGN KEY (title_id) REFERENCES titles (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE reviews (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  title_id   INT UNSIGNED NOT NULL,
  rating     TINYINT UNSIGNED NOT NULL,
  body       TEXT     NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_reviews_user_title (user_id, title_id),     -- one review per user and title
  KEY idx_reviews_title (title_id),
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT fk_reviews_user  FOREIGN KEY (user_id)  REFERENCES users (id)  ON DELETE CASCADE,
  CONSTRAINT fk_reviews_title FOREIGN KEY (title_id) REFERENCES titles (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- Sample data (fictional; same titles as the frontend mock data) ----------

INSERT INTO users (id, name, email, password_hash, role, is_active, created_at) VALUES
  (1, 'Demo User', 'demo.user@example.com', '$2y$10$548l0cMAs58CYwPBs.J3NOBOxqjlo4G65DSACPBfRvM25i8xfQVG2', 'user', 1, '2026-08-14 09:00:00'),
  (2, 'Alex Admin', 'alex.admin@example.com', '$2y$10$yXt.EBC.QqFdC8OMm2C77eS2KsbVPW75q4HA0MAhgJRC5qR0Q4SYy', 'admin', 1, '2026-08-01 09:00:00'),
  (3, 'Maya Petrovic', 'maya.p@example.com', '$2y$10$2JC93EngbHTg0EgYhFh9se8OqNYYNY/yvEUAgxuMIirpDyyj2LSSG', 'user', 1, '2026-09-03 09:00:00'),
  (4, 'Luka Kovac', 'luka.k@example.com', '$2y$10$Ck331zh0Y.ag96IJOyO65Oeah4K3UTydxV1RN91J6t34.u9nd4Lpy', 'user', 1, '2026-09-18 09:00:00'),
  (5, 'Sara Nikolic', 'sara.n@example.com', '$2y$10$xAk.k1.7pqPB5jyjGnToQO14rr.LB8pUFbctbHIuRkxZTicgLHWqG', 'user', 0, '2026-10-02 09:00:00');

INSERT INTO genres (id, name) VALUES
  (1, 'Drama'),
  (2, 'Comedy'),
  (3, 'Sci-Fi'),
  (4, 'Thriller'),
  (5, 'Mystery'),
  (6, 'Romance'),
  (7, 'Action'),
  (8, 'Adventure'),
  (9, 'Fantasy'),
  (10, 'Crime'),
  (11, 'Horror'),
  (12, 'Documentary');

INSERT INTO titles (id, tmdb_id, media_type, title, release_date, poster_path) VALUES
  (1, NULL, 'movie', 'The Last Lighthouse', '2024-03-15', NULL),
  (2, NULL, 'tv', 'Orbit Station Nine', '2023-09-08', NULL),
  (3, NULL, 'movie', 'Paper Moons', '2022-02-11', NULL),
  (4, NULL, 'tv', 'Quiet Harbor', '2025-01-20', NULL),
  (5, NULL, 'movie', 'Neon Courier', '2025-06-27', NULL),
  (6, NULL, 'movie', 'The Cartographer''s Daughter', '2021-11-05', NULL),
  (7, NULL, 'tv', 'Salt & Ember', '2024-10-04', NULL),
  (8, NULL, 'movie', 'Midnight Ledger', '2023-05-19', NULL),
  (9, NULL, 'tv', 'Small Hours', '2022-04-01', NULL),
  (10, NULL, 'movie', 'Glass Meridian', '2026-02-13', NULL),
  (11, NULL, 'tv', 'The Understudy', '2025-03-14', NULL),
  (12, NULL, 'movie', 'Frostline', '2020-12-04', NULL),
  (13, NULL, 'tv', 'Echoes of Marrow Bay', '2026-01-23', NULL),
  (14, NULL, 'movie', 'Wild Orchard', '2024-08-30', NULL);

INSERT INTO title_genres (title_id, genre_id) VALUES
  (1, 1),
  (1, 5),
  (2, 3),
  (2, 4),
  (3, 6),
  (3, 2),
  (4, 1),
  (5, 7),
  (5, 3),
  (6, 8),
  (6, 9),
  (7, 1),
  (7, 10),
  (8, 4),
  (8, 10),
  (9, 2),
  (10, 3),
  (10, 5),
  (11, 2),
  (11, 1),
  (12, 8),
  (12, 4),
  (13, 5),
  (13, 11),
  (14, 12);

INSERT INTO watchlist_items (id, user_id, title_id, status, progress_pct, progress_note, created_at, updated_at) VALUES
  (1, 1, 2, 'watching', 35, 'Season 2 · Episode 4', '2026-09-02 09:00:00', '2026-10-20 09:00:00'),
  (2, 1, 7, 'watching', 60, 'Season 1 · Episode 6', '2026-10-01 09:00:00', '2026-10-18 09:00:00'),
  (3, 1, 1, 'completed', 100, NULL, '2026-09-20 09:00:00', '2026-10-12 09:00:00'),
  (4, 1, 3, 'completed', 100, NULL, '2026-09-05 09:00:00', '2026-09-30 09:00:00'),
  (5, 1, 6, 'completed', 100, NULL, '2026-08-20 09:00:00', '2026-09-14 09:00:00'),
  (6, 1, 4, 'planned', 0, NULL, '2026-10-19 09:00:00', '2026-10-19 09:00:00'),
  (7, 1, 10, 'planned', 0, NULL, '2026-10-15 09:00:00', '2026-10-15 09:00:00'),
  (8, 1, 13, 'planned', 0, NULL, '2026-10-21 09:00:00', '2026-10-21 09:00:00'),
  (9, 3, 2, 'watching', 70, 'Season 3 · Episode 1', '2026-09-10 09:00:00', '2026-10-22 09:00:00'),
  (10, 3, 14, 'completed', 100, NULL, '2026-10-14 09:00:00', '2026-10-16 09:00:00'),
  (11, 4, 7, 'watching', 40, 'Season 1 · Episode 4', '2026-10-05 09:00:00', '2026-10-20 09:00:00'),
  (12, 4, 1, 'planned', 0, NULL, '2026-10-18 09:00:00', '2026-10-18 09:00:00');

INSERT INTO reviews (id, user_id, title_id, rating, body, created_at, updated_at) VALUES
  (1, 1, 1, 4, 'Slow and atmospheric. The handwriting reveal in the second act genuinely gave me chills, though the ending explains a little too much.', '2026-10-12 12:00:00', '2026-10-12 12:00:00'),
  (2, 1, 3, 3, 'Charming leads and a lovely set-design montage. The middle drags and the rivalry is resolved too quickly.', '2026-09-30 12:00:00', '2026-09-30 12:00:00'),
  (3, 1, 6, 5, 'Beautiful world-building. The maps fading into blank space is the best visual idea I have seen this year.', '2026-09-14 12:00:00', '2026-09-14 12:00:00'),
  (4, 3, 2, 5, 'Best sci-fi series in years. The slow reveal of the signal is brilliant.', '2026-10-05 12:00:00', '2026-10-05 12:00:00'),
  (5, 4, 7, 4, 'Great cast, and the kitchen scenes feel real. Needs a tighter finale.', '2026-10-09 12:00:00', '2026-10-09 12:00:00'),
  (6, 3, 14, 4, 'Quietly moving. I did not expect to care about an apple tree this much.', '2026-10-16 12:00:00', '2026-10-16 12:00:00');
