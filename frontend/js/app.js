/**
 * CineTrack entry point (Milestone 1: static prototype).
 *
 * Flow: the router reads the URL hash -> app.js picks a view -> the view writes HTML into the page
 * and attaches its own event listeners. No full page reloads happen after the first load.
 */
import { parseHash, startRouter } from './router.js';
import { renderShell, updateNavigation } from './components/navigation.js';
import { subscribe } from './state.js';
import { emptyState } from './components/feedback.js';
import { closeModal } from './components/modal.js';

import { renderLoginView } from './views/login-view.js';
import { renderRegisterView } from './views/register-view.js';
import { renderDashboardView } from './views/dashboard-view.js';
import { renderDiscoverView } from './views/discover-view.js';
import { renderWatchlistView } from './views/watchlist-view.js';
import { renderReviewsView } from './views/reviews-view.js';
import { renderProfileView } from './views/profile-view.js';
import { renderAdminView } from './views/admin-view.js';

// layout: 'auth' = full-screen form pages, 'app' = sidebar + top bar
const ROUTES = {
  '/login':     { title: 'Log in',    layout: 'auth', render: renderLoginView },
  '/register':  { title: 'Register',  layout: 'auth', render: renderRegisterView },
  '/dashboard': { title: 'Dashboard', layout: 'app',  render: renderDashboardView },
  '/discover':  { title: 'Discover',  layout: 'app',  render: renderDiscoverView },
  '/watchlist': { title: 'Watchlist', layout: 'app',  render: renderWatchlistView },
  '/reviews':   { title: 'Reviews',   layout: 'app',  render: renderReviewsView },
  '/profile':   { title: 'Profile',   layout: 'app',  render: renderProfileView },
  '/admin':     { title: 'Admin',     layout: 'app',  render: renderAdminView },
};

const NOT_FOUND = {
  title: 'Page not found',
  layout: 'app',
  render: (container) => {
    container.innerHTML = `<h1 class="page-title">Page not found</h1>${emptyState({
      iconName: 'compass',
      title: 'We could not find that page',
      text: 'The address may be mistyped.',
      actionHtml: '<a class="btn btn-primary" href="#/dashboard">Back to the dashboard</a>',
    })}`;
  },
};

const root = document.getElementById('app');
let currentLayout = null;
let shell = null;
let firstRender = true;

function renderRoute(route) {
  const definition = ROUTES[route.path] ?? NOT_FOUND;
  let container;
  closeModal(); // a dialog from the previous page must not stay open on the next one

  if (definition.layout === 'auth') {
    if (currentLayout !== 'auth') {
      root.innerHTML = '<main id="main" class="auth-shell" tabindex="-1"></main>';
      currentLayout = 'auth';
      shell = null;
    }
    container = root.querySelector('#main');
  } else {
    if (currentLayout !== 'app') {
      shell = renderShell(root, { onRoleChange: () => { if (parseHash().path === '/admin') renderRoute(parseHash()); } });
      currentLayout = 'app';
    }
    container = shell.view;
    updateNavigation(route.path);
    shell.closeMobileNav();
  }

  container.innerHTML = '';
  definition.render(container, route);
  document.title = `${definition.title} · CineTrack`;

  // Move keyboard/screen-reader focus to the new page heading (but not on the very first load).
  if (!firstRender) {
    window.scrollTo(0, 0);
    const heading = container.querySelector('h1');
    if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
  }
  firstRender = false;
}

// Keep the sidebar counts and user chip up to date whenever the demo state changes.
subscribe(() => { if (currentLayout === 'app') updateNavigation(parseHash().path); });

// If a poster image (when a title has one) fails to load, remove it so the coloured placeholder shows.
document.addEventListener('error', (event) => {
  if (event.target instanceof HTMLImageElement && event.target.matches('[data-poster-img]')) event.target.remove();
}, true);

startRouter(renderRoute);
