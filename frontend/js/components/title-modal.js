/** Title details modal, shared by Dashboard, Discover, Watchlist and Reviews. */
import { esc, typeLabel } from '../utils/dom.js';
import { icon } from './icons.js';
import { openModal, confirmDialog } from './modal.js';
import { demoToast } from './toast.js';
import { posterHtml, ratingPill } from './movie-card.js';
import { openReviewForm } from './review-form.js';
import {
  STATUSES, getTitle, genreNamesOf, getWatchItemByTitle, getReviewByTitle, releaseYear,
  addToWatchlist, setWatchStatus, removeFromWatchlist,
} from '../state.js';

function lengthText(title) {
  if (title.mediaType === 'tv') return `${title.seasons} season${title.seasons === 1 ? '' : 's'}`;
  return `${title.runtimeMinutes} min`;
}

function detailHtml(title) {
  const item = getWatchItemByTitle(title.id);
  const review = getReviewByTitle(title.id);

  const watchControls = item
    ? `<div class="detail-row">
         <label for="detail-status">Status</label>
         <select id="detail-status" data-status-select="${item.id}">
           ${STATUSES.map((s) => `<option value="${s.value}" ${s.value === item.status ? 'selected' : ''}>${s.label}</option>`).join('')}
         </select>
         <button type="button" class="btn btn-ghost btn-sm" data-remove-item="${item.id}">${icon('trash', 16)} Remove</button>
       </div>`
    : `<button type="button" class="btn btn-primary" data-add-title="${title.id}">${icon('plus', 18)} Add to watchlist</button>`;

  return `
    <div class="detail">
      <div class="detail-poster">${posterHtml(title)}</div>
      <div class="detail-info">
        <p class="detail-meta">${typeLabel(title.mediaType)} · ${releaseYear(title)} · ${lengthText(title)}</p>
        <p class="detail-rating">${ratingPill(title.rating)} <span class="muted">rating</span></p>
        <ul class="chip-list" aria-label="Genres">${genreNamesOf(title).map((g) => `<li>${esc(g)}</li>`).join('')}</ul>
        <p class="detail-overview">${esc(title.overview)}</p>
        <div class="detail-actions">
          ${watchControls}
          <button type="button" class="btn btn-secondary" data-review-title="${title.id}">${icon('edit', 16)} ${review ? 'Edit your review' : 'Write a review'}</button>
        </div>
      </div>
    </div>`;
}

/** onChange is called after anything changes so the page behind the modal can repaint. */
export function openTitleDetails(titleId, onChange = () => {}) {
  const title = getTitle(titleId);
  if (!title) return;

  openModal({
    title: title.title,
    size: 'lg',
    bodyHtml: detailHtml(title),
    onMount: (dialog) => {
      const body = dialog.querySelector('.modal-body');
      const refresh = (focusSelector) => {
        const current = getTitle(titleId);
        if (!current) return;
        body.innerHTML = detailHtml(current);
        body.querySelector(focusSelector)?.focus();
        onChange();
      };

      dialog.addEventListener('click', async (event) => {
        const add = event.target.closest('[data-add-title]');
        if (add) {
          addToWatchlist(titleId);
          demoToast(`Added "${title.title}" to your watchlist`);
          refresh('#detail-status');
          return;
        }
        const remove = event.target.closest('[data-remove-item]');
        if (remove) {
          const ok = await confirmDialog({ title: 'Remove from watchlist?', message: `"${title.title}" will be removed from your watchlist. Your review, if any, is kept.`, confirmLabel: 'Remove' });
          if (ok) {
            removeFromWatchlist(remove.dataset.removeItem);
            demoToast(`Removed "${title.title}" from your watchlist`);
            onChange();
          } else {
            openTitleDetails(titleId, onChange); // the confirm dialog replaced this modal, so bring it back
          }
          return;
        }
        const review = event.target.closest('[data-review-title]');
        if (review) openReviewForm({ titleId, onSaved: () => onChange() });
      });

      dialog.addEventListener('change', (event) => {
        const select = event.target.closest('[data-status-select]');
        if (!select) return;
        setWatchStatus(select.dataset.statusSelect, select.value);
        demoToast(`Status changed to ${select.options[select.selectedIndex].text}`);
        refresh('#detail-status');
      });
    },
  });
}
