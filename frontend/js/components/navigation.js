/**
 * App shell: sidebar navigation, top bar (search, user chip) and the footer.
 * The shell is built once; updateNavigation() only refreshes the parts that change.
 */
import { icon } from './icons.js';
import { esc, initials } from '../utils/dom.js';
import { navigate } from '../router.js';
import { state, watchlistStats, setRolePreview } from '../state.js';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { path: '/discover',  label: 'Discover',  icon: 'compass' },
  { path: '/watchlist', label: 'Watchlist', icon: 'list', countId: 'nav-watch-count' },
  { path: '/reviews',   label: 'Reviews',   icon: 'star' },
  { path: '/profile',   label: 'Profile',   icon: 'user' },
  { path: '/admin',     label: 'Admin',     icon: 'shield', adminOnly: true },
];

// The shell is rebuilt every time you come back from the login screen. If every rebuild added its own
// keydown listener to `document`, they would pile up. So there is ONE listener, added once here, and each
// new shell only replaces the function it calls.
let closeMenuOnEscape = null;
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && closeMenuOnEscape) closeMenuOnEscape();
});

export function renderShell(root, { onRoleChange }) {
  root.innerHTML = `
    <div class="app-shell" id="app-shell">
      <aside class="sidebar" id="sidebar" aria-label="Sidebar">
        <a class="brand" href="#/dashboard" aria-label="CineTrack home">
          <span class="brand-mark">${icon('play', 18)}</span><span class="brand-name">CineTrack</span>
        </a>
        <nav aria-label="Main navigation">
          <ul class="nav-list">
            ${NAV_ITEMS.map((item) => `
              <li${item.adminOnly ? ' data-admin-only' : ''}>
                <a class="nav-link" href="#${item.path}" data-nav="${item.path}">
                  ${icon(item.icon, 20)}<span>${item.label}</span>
                  ${item.countId ? `<span class="nav-count" id="${item.countId}"></span>` : ''}
                </a>
              </li>`).join('')}
          </ul>
        </nav>
        <div class="sidebar-footer">
          <div class="role-preview">
            <label for="role-preview">Preview role</label>
            <select id="role-preview">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <p>Preview only: changes what you see, not what you can do.</p>
          </div>
          <a class="nav-link" href="#/login">${icon('logout', 20)}<span>Log out</span></a>
        </div>
      </aside>
      <div class="sidebar-overlay" id="sidebar-overlay"></div>

      <div class="app-main">
        <header class="topbar">
          <button type="button" class="icon-btn menu-btn" id="menu-btn" aria-label="Open navigation menu" aria-expanded="false" aria-controls="sidebar">${icon('menu', 22)}</button>
          <form class="topbar-search" id="topbar-search" role="search">
            <label class="visually-hidden" for="topbar-search-input">Search movies and TV shows</label>
            ${icon('search', 18)}
            <input id="topbar-search-input" type="search" placeholder="Search movies and TV shows" autocomplete="off">
          </form>
          <div class="user-chip" id="user-chip"></div>
        </header>

        <main id="main" tabindex="-1"><div id="view"></div></main>

        <footer class="app-footer">
          <p><strong>Prototype with sample data.</strong> Titles, posters and ratings are fictional, and changes are not saved when you refresh.</p>
        </footer>
      </div>
    </div>`;

  const shell = root.querySelector('#app-shell');
  const menuButton = root.querySelector('#menu-btn');
  const setOpen = (open) => {
    shell.classList.toggle('nav-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
  };

  menuButton.addEventListener('click', () => setOpen(!shell.classList.contains('nav-open')));
  root.querySelector('#sidebar-overlay').addEventListener('click', () => { setOpen(false); menuButton.focus(); });
  root.querySelector('#sidebar').addEventListener('click', (event) => { if (event.target.closest('a')) setOpen(false); });
  // Tell the single Escape listener (below) how to close the menu of THIS shell.
  closeMenuOnEscape = () => {
    if (shell.isConnected && shell.classList.contains('nav-open')) { setOpen(false); menuButton.focus(); }
  };

  root.querySelector('#topbar-search').addEventListener('submit', (event) => {
    event.preventDefault();
    const q = root.querySelector('#topbar-search-input').value.trim();
    navigate('/discover', q ? { q } : undefined);
  });

  root.querySelector('#role-preview').addEventListener('change', (event) => {
    setRolePreview(event.target.value);
    onRoleChange();
  });

  return { view: root.querySelector('#view'), closeMobileNav: () => setOpen(false) };
}

export function updateNavigation(path) {
  document.querySelectorAll('.nav-link[data-nav]').forEach((link) => {
    if (link.dataset.nav === path) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });

  const isAdmin = state.role === 'admin';
  document.querySelectorAll('[data-admin-only]').forEach((el) => { el.hidden = !isAdmin; });

  const roleSelect = document.getElementById('role-preview');
  if (roleSelect) roleSelect.value = state.role;

  const count = document.getElementById('nav-watch-count');
  if (count) count.textContent = String(watchlistStats().total);

  const chip = document.getElementById('user-chip');
  if (chip) {
    chip.innerHTML = `
      <span class="avatar" aria-hidden="true">${esc(initials(state.profile.name))}</span>
      <span class="user-chip-text"><strong>${esc(state.profile.name)}</strong><small>${isAdmin ? 'Admin preview' : 'Demo user'}</small></span>`;
  }
}
