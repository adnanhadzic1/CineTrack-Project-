/**
 * Prototype state (Milestone 1).
 *
 * All "saved" changes live in this in-memory object and disappear when the page is refreshed.
 * Nothing is written to localStorage, a cookie or a server. In M4 this module is replaced by
 * calls to the REST API through the frontend service layer.
 */
import {
  GENRES, TITLES, DEMO_USER, WATCHLIST_SEED, REVIEWS_SEED, ADMIN_USERS, OTHER_REVIEWS_SEED,
} from './data/mock-data.js';

export const STATUSES = [
  { value: 'planned',   label: 'Planned' },
  { value: 'watching',  label: 'Watching' },
  { value: 'completed', label: 'Completed' },
];
export const statusLabel = (value) => STATUSES.find((s) => s.value === value)?.label ?? value;

const clone = (data) => JSON.parse(JSON.stringify(data));
const today = () => new Date().toISOString().slice(0, 10);

export const state = {
  // PROTOTYPE ONLY: a visual role preview. It does not grant any real permission.
  // Real authorization is decided by the backend (JWT + role middleware) from M4 on.
  role: 'user',
  profile: clone(DEMO_USER),
  genres: clone(GENRES),
  titles: clone(TITLES),
  watchlist: clone(WATCHLIST_SEED),
  reviews: clone(REVIEWS_SEED),
  users: clone(ADMIN_USERS),
  otherReviews: clone(OTHER_REVIEWS_SEED),
};

// ---- tiny publish/subscribe so the navigation can refresh counts and the admin link ----
const listeners = new Set();
export const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const notify = () => listeners.forEach((fn) => fn());

const nextId = (list) => list.reduce((max, item) => Math.max(max, item.id), 0) + 1;

// ---- selectors ----
export const getTitle = (id) => state.titles.find((t) => t.id === Number(id));
export const getGenreName = (id) => state.genres.find((g) => g.id === id)?.name;
export const genreNamesOf = (title) => title.genreIds.map(getGenreName).filter(Boolean);
export const getWatchItemByTitle = (titleId) => state.watchlist.find((w) => w.titleId === Number(titleId));
export const getReviewByTitle = (titleId) => state.reviews.find((r) => r.titleId === Number(titleId));
export const releaseYear = (title) => title.releaseDate.slice(0, 4);

export function watchlistStats() {
  const count = (status) => state.watchlist.filter((w) => w.status === status).length;
  return {
    total: state.watchlist.length,
    planned: count('planned'),
    watching: count('watching'),
    completed: count('completed'),
    reviews: state.reviews.length,
  };
}

// ---- watchlist actions ----
export function addToWatchlist(titleId, status = 'planned') {
  if (getWatchItemByTitle(titleId)) return null; // one row per user + title (unique constraint in the planned DB)
  const item = {
    id: nextId(state.watchlist), titleId: Number(titleId), status,
    progressPct: status === 'completed' ? 100 : 0, progressNote: '',
    addedAt: today(), updatedAt: today(),
  };
  state.watchlist.push(item);
  notify();
  return item;
}

export function setWatchStatus(itemId, status) {
  const item = state.watchlist.find((w) => w.id === Number(itemId));
  if (!item) return null;
  item.status = status;
  if (status === 'completed') item.progressPct = 100;
  if (status === 'planned') { item.progressPct = 0; item.progressNote = ''; }
  item.updatedAt = today();
  notify();
  return item;
}

export function removeFromWatchlist(itemId) {
  const before = state.watchlist.length;
  state.watchlist = state.watchlist.filter((w) => w.id !== Number(itemId));
  notify();
  return state.watchlist.length < before;
}

// ---- review actions ----
export function saveReview({ id, titleId, rating, text }) {
  if (id) {
    const review = state.reviews.find((r) => r.id === Number(id));
    if (!review) return null;
    Object.assign(review, { rating, text, updatedAt: today() });
    notify();
    return review;
  }
  if (getReviewByTitle(titleId)) return null; // one review per user + title
  const review = { id: nextId([...state.reviews, ...state.otherReviews]), titleId: Number(titleId), rating, text, createdAt: today(), updatedAt: today() };
  state.reviews.push(review);
  notify();
  return review;
}

export function deleteReview(id) {
  state.reviews = state.reviews.filter((r) => r.id !== Number(id));
  state.otherReviews = state.otherReviews.filter((r) => r.id !== Number(id));
  notify();
}

// ---- profile ----
export function saveProfile({ name, email, bio }) {
  Object.assign(state.profile, { name, email, bio });
  const me = state.users.find((u) => u.id === state.profile.id);
  if (me) Object.assign(me, { name, email });
  notify();
}

// ---- role preview (visual only) ----
export function setRolePreview(role) {
  state.role = role === 'admin' ? 'admin' : 'user';
  notify();
}

// ---- admin prototype actions (mirror ON DELETE CASCADE rules of the planned database) ----
export function adminSaveTitle({ id, title, mediaType, releaseDate }) {
  if (id) {
    const t = getTitle(id);
    if (!t) return null;
    Object.assign(t, { title, mediaType, releaseDate });
    notify();
    return t;
  }
  const created = {
    id: nextId(state.titles), tmdbId: null, mediaType, title, releaseDate, rating: 0, popularity: 0,
    runtimeMinutes: null, seasons: null, genreIds: [], hue: Math.floor(Math.random() * 360), posterUrl: null,
    overview: 'Added from the admin prototype. Real descriptions will come from TMDB.',
  };
  state.titles.push(created);
  notify();
  return created;
}

export function adminDeleteTitle(id) {
  const titleId = Number(id);
  state.titles = state.titles.filter((t) => t.id !== titleId);
  state.watchlist = state.watchlist.filter((w) => w.titleId !== titleId);
  state.reviews = state.reviews.filter((r) => r.titleId !== titleId);
  state.otherReviews = state.otherReviews.filter((r) => r.titleId !== titleId);
  notify();
}

export function adminSaveGenre({ id, name }) {
  if (id) {
    const g = state.genres.find((x) => x.id === Number(id));
    if (!g) return null;
    g.name = name;
    notify();
    return g;
  }
  const created = { id: nextId(state.genres), name };
  state.genres.push(created);
  notify();
  return created;
}

export function adminDeleteGenre(id) {
  const genreId = Number(id);
  state.genres = state.genres.filter((g) => g.id !== genreId);
  state.titles.forEach((t) => { t.genreIds = t.genreIds.filter((g) => g !== genreId); });
  notify();
}

export function adminSetUserRole(id, role) {
  const user = state.users.find((u) => u.id === Number(id));
  if (user) { user.role = role; notify(); }
}

export function adminToggleUserActive(id) {
  const user = state.users.find((u) => u.id === Number(id));
  if (user) { user.active = !user.active; notify(); }
}

export function adminDeleteUser(id) {
  const userId = Number(id);
  state.users = state.users.filter((u) => u.id !== userId);
  state.otherReviews = state.otherReviews.filter((r) => r.userId !== userId);
  notify();
}

/** All reviews as the admin moderation table sees them (demo user's reviews + other users'). */
export function allReviewsForAdmin() {
  const mine = state.reviews.map((r) => ({ ...r, userId: state.profile.id }));
  return [...mine, ...state.otherReviews].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export const getUserName = (id) => state.users.find((u) => u.id === Number(id))?.name ?? 'Unknown user';
