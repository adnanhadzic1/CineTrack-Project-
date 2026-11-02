/** Loading, empty and error states. */
import { esc } from '../utils/dom.js';
import { icon } from './icons.js';

/** actionHtml is trusted markup written by our own views (never user input). */
export function emptyState({ iconName = 'inbox', title, text = '', actionHtml = '' }) {
  return `
    <div class="state state-empty">
      <span class="state-icon">${icon(iconName, 32)}</span>
      <h3>${esc(title)}</h3>
      ${text ? `<p>${esc(text)}</p>` : ''}
      ${actionHtml}
    </div>`;
}

export function errorState({ title, text = '', retryLabel = 'Try again' }) {
  return `
    <div class="state state-error" role="alert">
      <span class="state-icon">${icon('alert', 32)}</span>
      <h3>${esc(title)}</h3>
      ${text ? `<p>${esc(text)}</p>` : ''}
      <button type="button" class="btn btn-secondary" data-retry>${icon('refresh', 16)} ${esc(retryLabel)}</button>
    </div>`;
}

/** Skeleton cards that look like the poster grid while "loading". */
export function loadingGrid(count = 8) {
  const card = `<div class="skeleton-card" aria-hidden="true"><div class="skeleton skeleton-poster"></div><div class="skeleton skeleton-line"></div><div class="skeleton skeleton-line short"></div></div>`;
  return `<div class="title-grid" role="status" aria-label="Loading titles">${card.repeat(count)}</div>`;
}
