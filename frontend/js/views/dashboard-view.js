/** Dashboard: every number and list is calculated from the shared mock state, so nothing can contradict. */
import { esc, mountPage, formatDate, typeLabel } from '../utils/dom.js';
import { icon } from '../components/icons.js';
import { emptyState } from '../components/feedback.js';
import { posterHtml, statusBadge, titleCardHtml } from '../components/movie-card.js';
import { openTitleDetails } from '../components/title-modal.js';
import { demoToast } from '../components/toast.js';
import { state, getTitle, getWatchItemByTitle, watchlistStats, setWatchStatus, addToWatchlist, releaseYear } from '../state.js';

const byNewest = (a, b) => b.updatedAt.localeCompare(a.updatedAt) || b.id - a.id;

export function renderDashboardView(container) {
  const page = mountPage(container);

  function paint() {
    const stats = watchlistStats();
    const firstName = state.profile.name.split(' ')[0];
    const watching = state.watchlist.filter((w) => w.status === 'watching').sort(byNewest);
    const recent = [...state.watchlist].sort(byNewest).slice(0, 5);
    const trending = state.titles.filter((t) => !getWatchItemByTitle(t.id)).sort((a, b) => b.popularity - a.popularity).slice(0, 8);

    page.innerHTML = `
      <section class="hero" aria-labelledby="dash-title">
        <div>
          <p class="eyebrow">Demo profile · mock data</p>
          <h1 id="dash-title">Welcome back, ${esc(firstName)}</h1>
          <p class="hero-text">${stats.watching
            ? `You are watching ${stats.watching} title${stats.watching === 1 ? '' : 's'} right now and have ${stats.planned} planned.`
            : `Nothing is in progress at the moment. You have ${stats.planned} title${stats.planned === 1 ? '' : 's'} planned.`}</p>
        </div>
        <div class="hero-actions">
          <a class="btn btn-primary" href="#/discover">${icon('compass', 18)} Discover titles</a>
          <a class="btn btn-secondary" href="#/reviews">${icon('star', 18)} Your reviews</a>
        </div>
      </section>

      <section class="stat-row" aria-label="Your numbers">
        <a class="stat" href="#/watchlist"><span class="stat-value">${stats.total}</span><span class="stat-label">In your watchlist</span></a>
        <a class="stat" href="#/watchlist?status=watching"><span class="stat-value">${stats.watching}</span><span class="stat-label">Currently watching</span></a>
        <a class="stat" href="#/watchlist?status=completed"><span class="stat-value">${stats.completed}</span><span class="stat-label">Completed</span></a>
        <a class="stat" href="#/reviews"><span class="stat-value">${stats.reviews}</span><span class="stat-label">Reviews written</span></a>
      </section>

      <div class="dash-columns">
        <section class="panel" aria-labelledby="continue-title">
          <h2 id="continue-title" class="panel-title">Continue watching</h2>
          ${watching.length ? `<ul class="continue-list">${watching.map(continueRow).join('')}</ul>` : emptyState({
            iconName: 'play',
            title: 'Nothing in progress',
            text: 'Set a title to "Watching" and it shows up here so you can pick it up again.',
            actionHtml: '<a class="btn btn-secondary" href="#/watchlist">Open your watchlist</a>',
          })}
        </section>

        <section class="panel" aria-labelledby="recent-title">
          <h2 id="recent-title" class="panel-title">Recently updated</h2>
          ${recent.length ? `<ol class="activity-list">${recent.map(activityRow).join('')}</ol>` : emptyState({
            title: 'No activity yet',
            text: 'Add a title from Discover and your latest changes will be listed here.',
          })}
        </section>
      </div>

      <section aria-labelledby="trending-title">
        <div class="section-head">
          <div>
            <h2 id="trending-title" class="section-title">Trending now</h2>
            <p class="muted">Mock ranking of titles you have not added yet. Real trending data will come from TMDB.</p>
          </div>
          <a class="btn btn-ghost btn-sm" href="#/discover">Browse all</a>
        </div>
        ${trending.length
          ? `<ul class="rail">${trending.map((t) => `<li class="rail-item">${titleCardHtml(t, null)}</li>`).join('')}</ul>`
          : emptyState({ title: 'You have added everything', text: 'Every title in the demo data is already on your watchlist.' })}
      </section>`;
  }

  function continueRow(item) {
    const title = getTitle(item.titleId);
    return `
      <li class="continue-row">
        <button type="button" class="continue-poster" data-open-title="${title.id}" aria-label="View details for ${esc(title.title)}">${posterHtml(title)}</button>
        <div class="continue-main">
          <h3>${esc(title.title)}</h3>
          <p class="muted">${typeLabel(title.mediaType)} · ${esc(item.progressNote || `${item.progressPct}% watched`)}</p>
          <div class="progress" role="progressbar" aria-label="Progress for ${esc(title.title)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${item.progressPct}"><span style="width:${item.progressPct}%"></span></div>
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
