/** Dashboard: every number and list is calculated from the shared mock state, so nothing can contradict. */
import { esc, mountPage, formatDate, typeLabel } from '../js/utils/dom.js';
import { icon } from '../js/components/icons.js';
import { emptyState } from '../js/components/feedback.js';
import { posterHtml, statusBadge, titleCardHtml } from '../js/components/movie-card.js';
import { openTitleDetails } from '../js/components/title-modal.js';
import { demoToast } from '../js/components/toast.js';
import { renderTemplate, bindText, bindHtml } from '../js/services/template-service.js';
import { state, getTitle, getWatchItemByTitle, watchlistStats, setWatchStatus, addToWatchlist, releaseYear, progressSummary } from '../js/state.js';

const byNewest = (a, b) => b.updatedAt.localeCompare(a.updatedAt) || b.id - a.id;

export function renderDashboardView(container) {
  const page = mountPage(container);

  function paint() {
    const stats = watchlistStats();
    const firstName = state.profile.name.split(' ')[0];
    const watching = state.watchlist.filter((w) => w.status === 'watching').sort(byNewest);
    const recent = [...state.watchlist].sort(byNewest).slice(0, 5);
    const trending = state.titles.filter((t) => !getWatchItemByTitle(t.id)).sort((a, b) => b.popularity - a.popularity).slice(0, 8);

    renderTemplate(page, 'dashboard'); // static layout lives in views/dashboard.html
    bindText(page, {
      firstName,
      heroText: stats.watching
        ? `You are watching ${stats.watching} title${stats.watching === 1 ? '' : 's'} right now and have ${stats.planned} planned.`
        : `Nothing is in progress at the moment. You have ${stats.planned} title${stats.planned === 1 ? '' : 's'} planned.`,
      statTotal: stats.total,
      statWatching: stats.watching,
      statCompleted: stats.completed,
      statReviews: stats.reviews,
    });
    bindHtml(page, {
      continue: watching.length ? `<ul class="continue-list">${watching.map(continueRow).join('')}</ul>` : emptyState({
        iconName: 'play',
        title: 'Nothing in progress',
        text: 'Set a title to "Watching" and it shows up here so you can pick it up again.',
        actionHtml: '<a class="btn btn-secondary" href="#/watchlist">Open your watchlist</a>',
      }),
      recent: recent.length ? `<ol class="activity-list">${recent.map(activityRow).join('')}</ol>` : emptyState({
        title: 'No activity yet',
        text: 'Add a title from Discover and your latest changes will be listed here.',
      }),
      trending: trending.length
        ? `<ul class="rail">${trending.map((t) => `<li class="rail-item">${titleCardHtml(t, null)}</li>`).join('')}</ul>`
        : emptyState({ title: 'You have added everything', text: 'Every available title is already on your watchlist.' }),
    });
  }

  function continueRow(item) {
    const title = getTitle(item.titleId);
    const summary = progressSummary(item);
    // With no progress logged yet there is nothing to draw, so the bar is left out.
    const bar = summary
      ? `<div class="progress" role="progressbar" aria-label="Progress for ${esc(title.title)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${item.progressPct}"><span style="width:${item.progressPct}%"></span></div>`
      : '';
    return `
      <li class="continue-row">
        <button type="button" class="continue-poster" data-open-title="${title.id}" aria-label="View details for ${esc(title.title)}">${posterHtml(title)}</button>
        <div class="continue-main">
          <h3>${esc(title.title)}</h3>
          <p class="muted">${typeLabel(title.mediaType)} · ${esc(summary || 'No progress logged yet')}</p>
          ${bar}
        </div>
        <button type="button" class="btn btn-secondary btn-sm" data-complete-item="${item.id}" aria-label="Mark ${esc(title.title)} as completed">${icon('check', 16)} Mark completed</button>
      </li>`;
  }

  function activityRow(item) {
    const title = getTitle(item.titleId);
    return `
      <li>
        <button type="button" class="activity-row" data-open-title="${title.id}">
          <span class="activity-name">${esc(title.title)} <span class="muted">(${releaseYear(title)})</span></span>
          <span class="activity-meta">${statusBadge(item.status)} <time datetime="${esc(item.updatedAt)}">${formatDate(item.updatedAt)}</time></span>
        </button>
      </li>`;
  }

  page.addEventListener('click', (event) => {
    const open = event.target.closest('[data-open-title]');
    if (open) { openTitleDetails(open.dataset.openTitle, paint); return; }

    const complete = event.target.closest('[data-complete-item]');
    if (complete) {
      const item = setWatchStatus(complete.dataset.completeItem, 'completed');
      demoToast(`Marked "${getTitle(item.titleId).title}" as completed`);
      paint();
      return;
    }

    const add = event.target.closest('[data-add-title]');
    if (add) {
      addToWatchlist(add.dataset.addTitle);
      demoToast(`Added "${getTitle(add.dataset.addTitle).title}" to your watchlist`);
      paint();
    }
  });

  paint();
}
