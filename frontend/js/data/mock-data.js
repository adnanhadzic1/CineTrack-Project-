/**
 * MOCK DATA - Milestone 1 only.
 *
 * Everything in this file is invented for the prototype. The titles are fictional on purpose,
 * so nobody mistakes the ratings or descriptions for real data. From M4 onwards the frontend
 * gets its data from the REST API (and TMDB through our backend) and this file is removed.
 *
 * Field notes (they mirror the planned database, see database/erd/erd.md):
 *  - In the real app only id, tmdbId, mediaType, title, releaseDate and posterPath are stored in
 *    our own database. overview, rating, runtime and seasons would be fetched live from TMDB.
 *  - tmdbId is null here because these titles do not exist in TMDB.
 *  - hue (0-360) colours the generated poster placeholder. posterUrl is null for every title.
 */

export const GENRES = [
  { id: 1, name: 'Drama' },
  { id: 2, name: 'Comedy' },
  { id: 3, name: 'Sci-Fi' },
  { id: 4, name: 'Thriller' },
  { id: 5, name: 'Mystery' },
  { id: 6, name: 'Romance' },
  { id: 7, name: 'Action' },
  { id: 8, name: 'Adventure' },
  { id: 9, name: 'Fantasy' },
  { id: 10, name: 'Crime' },
  { id: 11, name: 'Horror' },
  { id: 12, name: 'Documentary' },
];

export const TITLES = [
  { id: 1, tmdbId: null, mediaType: 'movie', title: 'The Last Lighthouse', releaseDate: '2024-03-15', rating: 7.9, popularity: 74, runtimeMinutes: 118, seasons: null, genreIds: [1, 5], hue: 205, posterUrl: null,
    overview: 'A retired keeper returns to a decommissioned lighthouse and finds the logbook still being written in his own handwriting.' },
  { id: 2, tmdbId: null, mediaType: 'tv', title: 'Orbit Station Nine', releaseDate: '2023-09-08', rating: 8.4, popularity: 96, runtimeMinutes: null, seasons: 3, genreIds: [3, 4], hue: 265, posterUrl: null,
    overview: 'Nine engineers share a failing research station while a signal from the far side of the moon grows harder to ignore.' },
  { id: 3, tmdbId: null, mediaType: 'movie', title: 'Paper Moons', releaseDate: '2022-02-11', rating: 7.1, popularity: 52, runtimeMinutes: 104, seasons: null, genreIds: [6, 2], hue: 330, posterUrl: null,
    overview: 'Two rival set designers are forced to build one film together and slowly discover they want the same ending.' },
  { id: 4, tmdbId: null, mediaType: 'tv', title: 'Quiet Harbor', releaseDate: '2025-01-20', rating: 8.1, popularity: 81, runtimeMinutes: null, seasons: 2, genreIds: [1], hue: 175, posterUrl: null,
    overview: 'A fishing town argues over whether to sell its harbor, and every family has something to gain or hide.' },
  { id: 5, tmdbId: null, mediaType: 'movie', title: 'Neon Courier', releaseDate: '2025-06-27', rating: 6.8, popularity: 88, runtimeMinutes: 109, seasons: null, genreIds: [7, 3], hue: 300, posterUrl: null,
    overview: 'A bike courier carries a package through one rain-soaked night in a city that wants it more than she does.' },
  { id: 6, tmdbId: null, mediaType: 'movie', title: "The Cartographer's Daughter", releaseDate: '2021-11-05', rating: 7.6, popularity: 61, runtimeMinutes: 131, seasons: null, genreIds: [8, 9], hue: 35, posterUrl: null,
    overview: 'After her father vanishes, a young mapmaker follows the unfinished edges of his last map into places that were never charted.' },
  { id: 7, tmdbId: null, mediaType: 'tv', title: 'Salt & Ember', releaseDate: '2024-10-04', rating: 8.6, popularity: 93, runtimeMinutes: null, seasons: 1, genreIds: [1, 10], hue: 15, posterUrl: null,
    overview: 'A cook and a detective grew up on the same street. Now a restaurant fire has put them on opposite sides of it.' },
  { id: 8, tmdbId: null, mediaType: 'movie', title: 'Midnight Ledger', releaseDate: '2023-05-19', rating: 7.3, popularity: 58, runtimeMinutes: 112, seasons: null, genreIds: [4, 10], hue: 240, posterUrl: null,
    overview: 'An auditor finds one number that does not add up and is the only person in the building who wants to know why.' },
  { id: 9, tmdbId: null, mediaType: 'tv', title: 'Small Hours', releaseDate: '2022-04-01', rating: 7.8, popularity: 66, runtimeMinutes: null, seasons: 4, genreIds: [2], hue: 55, posterUrl: null,
    overview: 'The overnight staff of a regional radio station keep each other sane, mostly, between traffic reports.' },
  { id: 10, tmdbId: null, mediaType: 'movie', title: 'Glass Meridian', releaseDate: '2026-02-13', rating: 7.0, popularity: 79, runtimeMinutes: 126, seasons: null, genreIds: [3, 5], hue: 190, posterUrl: null,
    overview: 'A surveyor discovers that a perfectly straight line drawn across the desert keeps arriving a day earlier than it should.' },
  { id: 11, tmdbId: null, mediaType: 'tv', title: 'The Understudy', releaseDate: '2025-03-14', rating: 7.5, popularity: 70, runtimeMinutes: null, seasons: 2, genreIds: [2, 1], hue: 345, posterUrl: null,
    overview: 'A stage understudy has never performed a single show, until the lead disappears an hour before curtain.' },
  { id: 12, tmdbId: null, mediaType: 'movie', title: 'Frostline', releaseDate: '2020-12-04', rating: 6.9, popularity: 45, runtimeMinutes: 98, seasons: null, genreIds: [8, 4], hue: 215, posterUrl: null,
    overview: 'Four strangers share one snowed-in mountain hut and one rule: nobody leaves before the storm does.' },
  { id: 13, tmdbId: null, mediaType: 'tv', title: 'Echoes of Marrow Bay', releaseDate: '2026-01-23', rating: 7.7, popularity: 85, runtimeMinutes: null, seasons: 1, genreIds: [5, 11], hue: 150, posterUrl: null,
    overview: 'Every winter the tide at Marrow Bay brings back something that was lost there years ago. This year it is a person.' },
  { id: 14, tmdbId: null, mediaType: 'movie', title: 'Wild Orchard', releaseDate: '2024-08-30', rating: 8.0, popularity: 49, runtimeMinutes: 92, seasons: null, genreIds: [12], hue: 95, posterUrl: null,
    overview: 'A year inside a family-run orchard as climate, debt and one stubborn heirloom apple tree decide the next harvest.' },
];

/** The signed-in "user" of the prototype. This is NOT real authentication. */
export const DEMO_USER = {
  id: 1,
  name: 'Demo User',
  email: 'demo.user@example.com',
  bio: 'Demo profile. Everything on this page is placeholder text.',
  joinedAt: '2026-08-14',
};

/** Seed for the demo watchlist. status: planned | watching | completed */
export const WATCHLIST_SEED = [
  { id: 1, titleId: 2,  status: 'watching',  progressPct: 35, progressNote: 'Season 2 · Episode 4',  addedAt: '2026-09-02', updatedAt: '2026-10-20' },
  { id: 2, titleId: 7,  status: 'watching',  progressPct: 60, progressNote: 'Season 1 · Episode 6',  addedAt: '2026-10-01', updatedAt: '2026-10-18' },
  { id: 3, titleId: 1,  status: 'completed', progressPct: 100, progressNote: '',                      addedAt: '2026-09-20', updatedAt: '2026-10-12' },
  { id: 4, titleId: 3,  status: 'completed', progressPct: 100, progressNote: '',                      addedAt: '2026-09-05', updatedAt: '2026-09-30' },
  { id: 5, titleId: 6,  status: 'completed', progressPct: 100, progressNote: '',                      addedAt: '2026-08-20', updatedAt: '2026-09-14' },
  { id: 6, titleId: 4,  status: 'planned',   progressPct: 0,  progressNote: '',                      addedAt: '2026-10-19', updatedAt: '2026-10-19' },
  { id: 7, titleId: 10, status: 'planned',   progressPct: 0,  progressNote: '',                      addedAt: '2026-10-15', updatedAt: '2026-10-15' },
  { id: 8, titleId: 13, status: 'planned',   progressPct: 0,  progressNote: '',                      addedAt: '2026-10-21', updatedAt: '2026-10-21' },
];

/** Reviews written by the demo user. rating is 1-5. */
export const REVIEWS_SEED = [
  { id: 1, titleId: 1, rating: 4, text: 'Slow and atmospheric. The handwriting reveal in the second act genuinely gave me chills, though the ending explains a little too much.', createdAt: '2026-10-12', updatedAt: '2026-10-12' },
  { id: 2, titleId: 3, rating: 3, text: 'Charming leads and a lovely set-design montage. The middle drags and the rivalry is resolved too quickly.', createdAt: '2026-09-30', updatedAt: '2026-09-30' },
  { id: 3, titleId: 6, rating: 5, text: 'Beautiful world-building. The maps fading into blank space is the best visual idea I have seen this year.', createdAt: '2026-09-14', updatedAt: '2026-09-14' },
];

/** Other (fake) accounts - only used by the admin prototype. */
export const ADMIN_USERS = [
  { id: 1, name: 'Demo User',      email: 'demo.user@example.com',  role: 'user',  active: true,  joinedAt: '2026-08-14' },
  { id: 2, name: 'Alex Admin',     email: 'alex.admin@example.com', role: 'admin', active: true,  joinedAt: '2026-08-01' },
  { id: 3, name: 'Maya Petrovic',  email: 'maya.p@example.com',     role: 'user',  active: true,  joinedAt: '2026-09-03' },
  { id: 4, name: 'Luka Kovac',     email: 'luka.k@example.com',     role: 'user',  active: true,  joinedAt: '2026-09-18' },
  { id: 5, name: 'Sara Nikolic',   email: 'sara.n@example.com',     role: 'user',  active: false, joinedAt: '2026-10-02' },
];

/** Reviews written by other fake users - only used by the admin prototype. */
export const OTHER_REVIEWS_SEED = [
  { id: 101, userId: 3, titleId: 2, rating: 5, text: 'Best sci-fi series in years. The slow reveal of the signal is brilliant.', createdAt: '2026-10-05', updatedAt: '2026-10-05' },
  { id: 102, userId: 4, titleId: 7, rating: 4, text: 'Great cast, and the kitchen scenes feel real. Needs a tighter finale.', createdAt: '2026-10-09', updatedAt: '2026-10-09' },
  { id: 103, userId: 3, titleId: 14, rating: 4, text: 'Quietly moving. I did not expect to care about an apple tree this much.', createdAt: '2026-10-16', updatedAt: '2026-10-16' },
];
