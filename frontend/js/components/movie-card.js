/** Poster, title card, status badge and star rating markup. */
import { esc, typeLabel } from '../utils/dom.js';
import { icon } from './icons.js';
import { releaseYear, statusLabel } from '../state.js';

/**
 * Poster placeholder. Mock titles have no poster image, so a coloured panel with the title is drawn.
 * If a title ever has posterUrl and the image fails to load, app.js removes the <img> and this panel stays.
 */
export function posterHtml(title, extraClass = '') {
  const image = title.posterUrl
    ? `<img src="${esc(title.posterUrl)}" alt="" loading="lazy" data-poster-img>`
    : '';
  return `<div class="poster ${extraClass}" style="--hue:${Number(title.hue) || 220}">${image}<span class="poster-title">${esc(title.title)}</span></div>`;
}

export const statusBadge = (status) => `<span class="badge badge-${esc(status)}">${esc(statusLabel(status))}</span>`;

export const typeChip = (mediaType) =>
  `<span class="type-chip">${icon(mediaType === 'tv' ? 'tv' : 'film', 14)} ${typeLabel(mediaType)}</span>`;

export const ratingPill = (rating) =>
  rating > 0 ? `<span class="rating-pill" title="Mock community rating">${icon('star', 13)} ${rating.toFixed(1)}</span>` : '';

/** 1-5 stars for a user's personal review. */
export function starsHtml(rating) {
  const full = '★'.repeat(rating);
  const empty = '☆'.repeat(5 - rating);
  return `<span class="stars" role="img" aria-label="${rating} out of 5 stars">${full}${empty}</span>`;
}

/**
 * Grid card used on Discover. The poster opens the details modal.
 * Buttons carry data-* attributes; the view handles them with one delegated click listener.
 */
export function titleCardHtml(title, watchItem) {
  const action = watchItem
    ? `<div class="card-status">${statusBadge(watchItem.status)}</div>`
    : `<button type="button" class="btn btn-secondary btn-sm btn-block" data-add-title="${title.id}">${icon('plus', 16)} Add to watchlist</button>`;
  return `
    <article class="title-card">
      <button type="button" class="title-card-poster" data-open-title="${title.id}" aria-label="View details for ${esc(title.title)}">
        ${posterHtml(title)}
        <span class="title-card-tags">${typeChip(title.mediaType)}${ratingPill(title.rating)}</span>
      </button>
      <div class="title-card-body">
        <h3 class="title-card-name">${esc(title.title)}</h3>
        <p class="title-card-meta">${releaseYear(title)} · ${typeLabel(title.mediaType)}</p>
        ${action}
      </div>
    </article>`;
}
