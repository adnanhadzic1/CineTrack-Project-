/**
 * Discover: search + filters + poster grid over the MOCK dataset.
 * Planned: in M3/M4 the search box will call our backend, which calls TMDB (the browser never calls TMDB directly).
 */
import { esc, mountPage } from '../js/utils/dom.js';
import { emptyState, errorState, loadingGrid } from '../js/components/feedback.js';
import { titleCardHtml } from '../js/components/movie-card.js';
import { openTitleDetails } from '../js/components/title-modal.js';
import { demoToast, showToast } from '../js/components/toast.js';
import { renderTemplate, bindHtml } from '../js/services/template-service.js';
import { state, getTitle, getWatchItemByTitle, addToWatchlist } from '../js/state.js';

const SORTS = {
  popular: { label: 'Most popular', compare: (a, b) => b.popularity - a.popularity },
  rating:  { label: 'Highest rated', compare: (a, b) => b.rating - a.rating },
  newest:  { label: 'Newest first', compare: (a, b) => b.releaseDate.localeCompare(a.releaseDate) },
  title:   { label: 'Title A-Z', compare: (a, b) => a.title.localeCompare(b.title) },
};
const TYPES = [
  { value: 'all', label: 'All' },
  { value: 'movie', label: 'Movies' },
  { value: 'tv', label: 'TV shows' },
];

export function renderDiscoverView(container, route) {
  const page = mountPage(container);
  const view = { q: route.query.get('q') ?? '', type: 'all', genre: 'all', sort: 'popular', mode: 'ready' }; // mode: ready | loading | error

  const usedGenres = state.genres.filter((g) => state.titles.some((t) => t.genreIds.includes(g.id)));

  renderTemplate(page, 'discover'); // static layout lives in views/discover.html
  page.querySelector('#discover-q').value = view.q;
  bindHtml(page, {
    typeButtons: TYPES.map((t) => `<button type="button" data-type="${t.value}" aria-pressed="${t.value === view.type}">${t.label}</button>`).join(''),
    sortOptions: Object.entries(SORTS).map(([value, s]) => `<option value="${value}">${s.label}</option>`).join(''),
    genreChips: usedGenres.map((g) => `<button type="button" class="chip" data-genre="${g.id}" aria-pressed="false">${esc(g.name)}</button>`).join(''),
  });

  const results = page.querySelector('#discover-results');
  const count = page.querySelector('#discover-count');

  const matches = () => {
    const q = view.q.trim().toLowerCase();
    return state.titles
      .filter((t) => (view.type === 'all' || t.mediaType === view.type)
        && (view.genre === 'all' || t.genreIds.includes(Number(view.genre)))
        && (!q || t.title.toLowerCase().includes(q)))
      .sort(SORTS[view.sort].compare);
  };

  function syncControls() {
    page.querySelectorAll('[data-type]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.type === view.type)));
    page.querySelectorAll('[data-genre]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.genre === String(view.genre))));
  }

  function paintResults() {
    syncControls();
    if (view.mode === 'loading') {
      count.textContent = 'Loading titles…';
      results.innerHTML = loadingGrid(8);
      return;
    }
    if (view.mode === 'error') {
      count.textContent = '';
      results.innerHTML = errorState({
        title: 'We could not load titles',
        text: 'Something went wrong while loading titles. Please try again.',
        retryLabel: 'Try again',
      });
      return;
    }

    const list = matches();
    count.textContent = `${list.length} title${list.length === 1 ? '' : 's'} found${view.q.trim() ? ` for “${view.q.trim()}”` : ''}`;
    results.innerHTML = list.length
      ? `<div class="title-grid">${list.map((t) => titleCardHtml(t, getWatchItemByTitle(t.id))).join('')}</div>`
      : emptyState({
          iconName: 'search',
          title: 'No titles match your search',
          text: 'Try a different spelling, or clear the filters.',
          actionHtml: '<button type="button" class="btn btn-secondary" data-clear-filters>Clear search and filters</button>',
        });
  }

  const setMode = (mode) => { view.mode = mode; paintResults(); };

  page.addEventListener('click', (event) => {
    const type = event.target.closest('[data-type]');
    if (type) { view.type = type.dataset.type; paintResults(); return; }

    const genre = event.target.closest('[data-genre]');
    if (genre) { view.genre = genre.dataset.genre; paintResults(); return; }

    if (event.target.closest('[data-clear-filters]')) {
      Object.assign(view, { q: '', type: 'all', genre: 'all' });
      page.querySelector('#discover-q').value = '';
      paintResults();
      return;
    }

    const preview = event.target.closest('[data-preview]');
    if (preview) {
      if (preview.dataset.preview === 'loading') {
        setMode('loading');
        setTimeout(() => { if (page.isConnected && view.mode === 'loading') setMode('ready'); }, 1400);
      } else {
        setMode('error');
      }
      return;
    }

    if (event.target.closest('[data-retry]')) { setMode('ready'); showToast('Titles reloaded.', 'info'); return; }

    const open = event.target.closest('[data-open-title]');
    if (open) { openTitleDetails(open.dataset.openTitle, paintResults); return; }

    const add = event.target.closest('[data-add-title]');
    if (add) {
      const id = add.dataset.addTitle;
      addToWatchlist(id);
      demoToast(`Added "${getTitle(id).title}" to your watchlist`);
      paintResults();
      page.querySelector(`[data-open-title="${id}"]`)?.focus();
    }
  });

  page.querySelector('#discover-search').addEventListener('submit', (event) => event.preventDefault());
  page.querySelector('#discover-q').addEventListener('input', (event) => { view.q = event.target.value; if (view.mode === 'ready') paintResults(); });
  page.querySelector('#discover-sort').addEventListener('change', (event) => { view.sort = event.target.value; paintResults(); });

  paintResults();
}
