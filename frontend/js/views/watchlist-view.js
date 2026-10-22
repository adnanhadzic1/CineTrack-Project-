/** Watchlist: filter by status and type, change status, write a review, remove. Demo state only. */
import { esc, mountPage, formatDate, typeLabel } from '../utils/dom.js';
import { icon } from '../components/icons.js';
import { emptyState } from '../components/feedback.js';
import { posterHtml, typeChip } from '../components/movie-card.js';
import { confirmDialog } from '../components/modal.js';
import { openTitleDetails } from '../components/title-modal.js';
import { openReviewForm } from '../components/review-form.js';
import { demoToast } from '../components/toast.js';
import {
  STATUSES, state, getTitle, genreNamesOf, releaseYear, statusLabel, watchlistStats, setWatchStatus, removeFromWatchlist,
} from '../state.js';

export function renderWatchlistView(container, route) {
  const page = mountPage(container);
  const requested = route.query.get('status');
  const view = { status: STATUSES.some((s) => s.value === requested) ? requested : 'all', type: 'all' };

  page.innerHTML = `
    <header class="page-head">
      <div>
        <h1 class="page-title">Your watchlist</h1>
        <p class="muted">Everything you plan to watch, are watching or have finished.</p>
      </div>
      <a class="btn btn-primary" href="#/discover">${icon('plus', 18)} Add titles</a>
    </header>
    <p class="notice" role="note"><strong>Demo state.</strong> Changes here are kept in memory only and reset when you refresh the page. Saving to a database arrives in later milestones.</p>

    <div class="filter-bar">
      <div class="segmented" id="wl-status" role="group" aria-label="Filter by status"></div>
      <div class="inline-field">
        <label for="wl-type">Type</label>
        <select id="wl-type">
          <option value="all">All types</option>
          <option value="movie">Movies</option>
          <option value="tv">TV shows</option>
        </select>
      </div>
    </div>
    <p id="wl-count" class="results-count" aria-live="polite"></p>
    <div id="wl-results"></div>`;

  const statusBar = page.querySelector('#wl-status');
  const results = page.querySelector('#wl-results');
  const count = page.querySelector('#wl-count');

  function rowHtml(item) {
    const title = getTitle(item.titleId);
    return `
      <li class="wl-row">
        <button type="button" class="wl-poster" data-open-title="${title.id}" aria-label="View details for ${esc(title.title)}">${posterHtml(title)}</button>
        <div class="wl-main">
          <h3 class="wl-title"><button type="button" class="link-btn" data-open-title="${title.id}">${esc(title.title)}</button></h3>
          <p class="wl-meta">${typeChip(title.mediaType)} <span>${releaseYear(title)}</span> <span class="muted">${esc(genreNamesOf(title).join(', '))}</span></p>
          ${item.status === 'watching' ? `
            <div class="wl-progress">
              <div class="progress" role="progressbar" aria-label="Progress for ${esc(title.title)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${item.progressPct}"><span style="width:${item.progressPct}%"></span></div>
              <span class="muted">${esc(item.progressNote || `${item.progressPct}% watched`)}</span>
            </div>` : ''}
          <p class="wl-dates muted">Added ${formatDate(item.addedAt)} · Updated ${formatDate(item.updatedAt)}</p>
        </div>
        <div class="wl-controls">
          <label class="visually-hidden" for="st-${item.id}">Status for ${esc(title.title)}</label>
          <select id="st-${item.id}" data-status-select="${item.id}">
            ${STATUSES.map((s) => `<option value="${s.value}" ${s.value === item.status ? 'selected' : ''}>${s.label}</option>`).join('')}
          </select>
          <button type="button" class="icon-btn" data-review-title="${title.id}" aria-label="Write or edit your review of ${esc(title.title)}" title="Review">${icon('edit', 18)}</button>
          <button type="button" class="icon-btn icon-btn-danger" data-remove-item="${item.id}" aria-label="Remove ${esc(title.title)} from your watchlist" title="Remove">${icon('trash', 18)}</button>
        </div>
      </li>`;
  }

  function paint() {
    const stats = watchlistStats();
    const tabs = [{ value: 'all', label: 'All', n: stats.total }, ...STATUSES.map((s) => ({ ...s, n: stats[s.value] }))];
    statusBar.innerHTML = tabs.map((t) => `<button type="button" data-status="${t.value}" aria-pressed="${t.value === view.status}">${t.label} <span class="tab-count">${t.n}</span></button>`).join('');
    page.querySelector('#wl-type').value = view.type;

    const items = state.watchlist
      .filter((w) => (view.status === 'all' || w.status === view.status) && (view.type === 'all' || getTitle(w.titleId).mediaType === view.type))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || b.id - a.id);

    count.textContent = stats.total ? `Showing ${items.length} of ${stats.total} title${stats.total === 1 ? '' : 's'}` : '';

    if (!stats.total) {
      results.innerHTML = emptyState({
        iconName: 'list',
        title: 'Your watchlist is empty',
        text: 'Find something to watch and add it here.',
        actionHtml: '<a class="btn btn-primary" href="#/discover">Discover titles</a>',
      });
    } else if (!items.length) {
      const what = [view.status !== 'all' ? statusLabel(view.status).toLowerCase() : '', view.type !== 'all' ? typeLabel(view.type).toLowerCase() : ''].filter(Boolean).join(' ');
      results.innerHTML = emptyState({
        title: `No ${what || 'matching'} titles`,
        text: 'Nothing on your watchlist matches these filters.',
        actionHtml: '<button type="button" class="btn btn-secondary" data-clear-filters>Show everything</button>',
      });
    } else {
      results.innerHTML = `<ul class="wl-list">${items.map(rowHtml).join('')}</ul>`;
    }
  }

  page.addEventListener('click', async (event) => {
    const status = event.target.closest('[data-status]');
    if (status) { view.status = status.dataset.status; paint(); page.querySelector(`[data-status="${view.status}"]`)?.focus(); return; }

    if (event.target.closest('[data-clear-filters]')) { view.status = 'all'; view.type = 'all'; paint(); return; }

    const open = event.target.closest('[data-open-title]');
    if (open) { openTitleDetails(open.dataset.openTitle, paint); return; }

    const review = event.target.closest('[data-review-title]');
    if (review) { openReviewForm({ titleId: review.dataset.reviewTitle, onSaved: paint }); return; }

    const remove = event.target.closest('[data-remove-item]');
    if (remove) {
      const item = state.watchlist.find((w) => w.id === Number(remove.dataset.removeItem));
      const title = getTitle(item.titleId);
      const ok = await confirmDialog({
        title: 'Remove from watchlist?',
        message: `"${title.title}" will be removed from your watchlist. Your review, if you wrote one, is kept.`,
        confirmLabel: 'Remove',
      });
      if (ok) {
        removeFromWatchlist(item.id);
        demoToast(`Removed "${title.title}" from your watchlist`);
        paint();
      }
    }
  });

  page.addEventListener('change', (event) => {
    if (event.target.id === 'wl-type') { view.type = event.target.value; paint(); return; }
    const select = event.target.closest('[data-status-select]');
    if (select) {
      const item = setWatchStatus(select.dataset.statusSelect, select.value);
      demoToast(`"${getTitle(item.titleId).title}" is now ${statusLabel(item.status).toLowerCase()}`);
      paint();
      page.querySelector(`#st-${item.id}`)?.focus();
    }
  });

  paint();
}
