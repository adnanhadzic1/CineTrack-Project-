/**
 * Admin panel PROTOTYPE.
 * It only shows how administrators will manage users, titles, genres and reviews later.
 * The "Preview role" switch in the sidebar is purely visual: it unlocks nothing real.
 * In Milestone 4 the backend (JWT + role middleware) decides who may call the admin endpoints and answers 403 to everyone else.
 */
import { esc, mountPage, formatDate, typeLabel } from '../js/utils/dom.js';
import { fieldHtml, setFieldError } from '../js/utils/forms.js';
import { icon } from '../js/components/icons.js';
import { emptyState } from '../js/components/feedback.js';
import { renderTemplate, bindText, bindHtml } from '../js/services/template-service.js';
import { starsHtml } from '../js/components/movie-card.js';
import { openModal, confirmDialog } from '../js/components/modal.js';
import { demoToast } from '../js/components/toast.js';
import {
  state, getTitle, getUserName, genreNamesOf, allReviewsForAdmin,
  adminSaveTitle, adminDeleteTitle, adminSaveGenre, adminDeleteGenre,
  adminSetUserRole, adminToggleUserActive, adminDeleteUser, deleteReview,
} from '../js/state.js';

const TABS = [
  { id: 'users', label: 'Users' },
  { id: 'titles', label: 'Titles' },
  { id: 'genres', label: 'Genres' },
  { id: 'reviews', label: 'Reviews' },
];

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

function actionButton({ label, attr, value, iconName, danger = false, disabled = false, hint = '' }) {
  return `<button type="button" class="btn btn-ghost btn-sm ${danger ? 'btn-danger-text' : ''}" data-${attr}="${value}" ${disabled ? `disabled title="${esc(hint)}"` : ''}>${icon(iconName, 15)} ${esc(label)}</button>`;
}

export function renderAdminView(container) {
  const page = mountPage(container);

  // The sidebar hides the Admin link for the "user" preview, but someone can still type #/admin.
  // Show what a 403 will look like in the real app.
  if (state.role !== 'admin') {
    renderTemplate(page, 'admin-forbidden'); // layout lives in views/admin-forbidden.html
    bindHtml(page, {
      forbidden: emptyState({
        iconName: 'lock',
        title: '403 · Administrators only',
        text: 'You do not have permission to view this page.',
        actionHtml: '<a class="btn btn-primary" href="#/dashboard">Back to the dashboard</a>',
      }),
    });
    return;
  }

  const view = { tab: 'users', filter: '' };

  // True when the text contains what was typed in the filter box (or when the box is empty).
  const matches = (text) => !view.filter.trim() || text.toLowerCase().includes(view.filter.trim().toLowerCase());

  // ---------- table builders (one per entity) ----------
  const tables = {
    users: () => {
      const rows = state.users.filter((u) => matches(`${u.name} ${u.email} ${u.role}`));
      return table(['Name', 'Email', 'Role', 'Status', 'Joined', 'Actions'], rows.map((u) => {
        const self = u.id === state.profile.id;
        const hint = 'You cannot change your own account from the admin panel.';
        return `<tr>
          <td data-label="Name">${esc(u.name)}${self ? ' <span class="muted">(you)</span>' : ''}</td>
          <td data-label="Email">${esc(u.email)}</td>
          <td data-label="Role"><span class="badge badge-role-${u.role}">${u.role === 'admin' ? 'Admin' : 'User'}</span></td>
          <td data-label="Status"><span class="badge ${u.active ? 'badge-completed' : 'badge-muted'}">${u.active ? 'Active' : 'Inactive'}</span></td>
          <td data-label="Joined">${formatDate(u.joinedAt)}</td>
          <td data-label="Actions" class="row-actions">
            ${actionButton({ label: u.role === 'admin' ? 'Make user' : 'Make admin', attr: 'user-role', value: u.id, iconName: 'shield', disabled: self, hint })}
            ${actionButton({ label: u.active ? 'Deactivate' : 'Activate', attr: 'user-active', value: u.id, iconName: 'lock', disabled: self, hint })}
            ${actionButton({ label: 'Delete', attr: 'user-delete', value: u.id, iconName: 'trash', danger: true, disabled: self, hint })}
          </td></tr>`;
      }), 'No users match your filter.');
    },

    titles: () => {
      const rows = state.titles.filter((t) => matches(`${t.title} ${t.mediaType} ${genreNamesOf(t).join(' ')}`));
      return table(['Title', 'Type', 'Release date', 'Genres', 'Actions'], rows.map((t) => `<tr>
          <td data-label="Title">${esc(t.title)}</td>
          <td data-label="Type">${typeLabel(t.mediaType)}</td>
          <td data-label="Release date">${formatDate(t.releaseDate)}</td>
          <td data-label="Genres">${esc(genreNamesOf(t).join(', ')) || '<span class="muted">none</span>'}</td>
          <td data-label="Actions" class="row-actions">
            ${actionButton({ label: 'Edit', attr: 'title-edit', value: t.id, iconName: 'edit' })}
            ${actionButton({ label: 'Delete', attr: 'title-delete', value: t.id, iconName: 'trash', danger: true })}
          </td></tr>`), 'No titles match your filter.');
    },

    genres: () => {
      const rows = state.genres.filter((g) => matches(g.name));
      return table(['Genre', 'Titles using it', 'Actions'], rows.map((g) => `<tr>
          <td data-label="Genre">${esc(g.name)}</td>
          <td data-label="Titles using it">${state.titles.filter((t) => t.genreIds.includes(g.id)).length}</td>
          <td data-label="Actions" class="row-actions">
            ${actionButton({ label: 'Rename', attr: 'genre-edit', value: g.id, iconName: 'edit' })}
            ${actionButton({ label: 'Delete', attr: 'genre-delete', value: g.id, iconName: 'trash', danger: true })}
          </td></tr>`), 'No genres match your filter.');
    },

    reviews: () => {
      const rows = allReviewsForAdmin().filter((r) => matches(`${getUserName(r.userId)} ${getTitle(r.titleId)?.title ?? ''} ${r.text}`));
      return table(['User', 'Title', 'Rating', 'Review', 'Date', 'Actions'], rows.map((r) => `<tr>
          <td data-label="User">${esc(getUserName(r.userId))}</td>
          <td data-label="Title">${esc(getTitle(r.titleId)?.title ?? 'Unknown title')}</td>
          <td data-label="Rating">${starsHtml(r.rating)}</td>
          <td data-label="Review" class="cell-text">${esc(r.text.length > 90 ? `${r.text.slice(0, 90)}…` : r.text)}</td>
          <td data-label="Date">${formatDate(r.createdAt)}</td>
          <td data-label="Actions" class="row-actions">
            ${actionButton({ label: 'Delete', attr: 'review-delete', value: r.id, iconName: 'trash', danger: true })}
          </td></tr>`), 'No reviews match your filter.');
    },
  };

  function table(headings, rows, emptyText) {
    if (!rows.length) return emptyState({ iconName: 'search', title: 'Nothing to show', text: emptyText });
    return `<div class="table-wrap"><table class="data-table">
      <thead><tr>${headings.map((h) => `<th scope="col">${h}</th>`).join('')}</tr></thead>
      <tbody>${rows.join('')}</tbody></table></div>`;
  }

  // ---------- page shell ----------
  function paintAll() {
    const tab = TABS.find((t) => t.id === view.tab);
    const counts = { users: state.users.length, titles: state.titles.length, genres: state.genres.length, reviews: allReviewsForAdmin().length };

    renderTemplate(page, 'admin'); // static layout lives in views/admin.html
    bindText(page, { filterLabel: `Filter ${tab.label.toLowerCase()}` });
    bindHtml(page, {
      tiles: TABS.map((t) => `<div class="admin-tile"><span class="admin-tile-value">${counts[t.id]}</span><span class="admin-tile-label">${t.label}</span></div>`).join(''),
      tabs: TABS.map((t) => `<button type="button" data-tab="${t.id}" aria-pressed="${t.id === view.tab}">${t.label}</button>`).join(''),
      toolbarButtons: view.tab === 'titles' ? `<button type="button" class="btn btn-primary" data-title-add>${icon('plus', 18)} Add title</button>`
        : view.tab === 'genres' ? `<button type="button" class="btn btn-primary" data-genre-add>${icon('plus', 18)} Add genre</button>` : '',
    });
    page.querySelector('#admin-filter').value = view.filter;
    paintTable();
  }

  function paintTable() {
    page.querySelector('#admin-table').innerHTML = tables[view.tab]();
  }

  // ---------- small forms (modals) ----------
  function openTitleForm(id) {
    const existing = id ? getTitle(id) : null;
    openModal({
      title: existing ? 'Edit title' : 'Add title',
      bodyHtml: `
        <form id="title-form" novalidate>
          ${fieldHtml({ id: 'tf-title', label: 'Title', value: existing?.title ?? '', maxlength: 120 })}
          <div class="field">
            <label for="tf-type">Type</label>
            <select id="tf-type"><option value="movie">Movie</option><option value="tv">TV show</option></select>
          </div>
          ${fieldHtml({ id: 'tf-date', label: 'Release date', type: 'date', value: existing?.releaseDate ?? '' })}
          <p class="mock-note">Descriptions, posters and ratings are not edited here.</p>
          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" data-modal-cancel>Cancel</button>
            <button type="submit" class="btn btn-primary">${existing ? 'Save changes' : 'Add title'}</button>
          </div>
        </form>`,
      onMount: (dialog, close) => {
        const form = dialog.querySelector('#title-form');
        const name = form.querySelector('#tf-title');
        const type = form.querySelector('#tf-type');
        const date = form.querySelector('#tf-date');
        if (existing) type.value = existing.mediaType;
        dialog.querySelector('[data-modal-cancel]').addEventListener('click', () => close());
        form.addEventListener('submit', (event) => {
          event.preventDefault();
          const okName = setFieldError(name, name.value.trim() ? '' : 'Please enter a title.');
          const okDate = setFieldError(date, date.value ? '' : 'Please choose a release date.');
          if (!okName || !okDate) { form.querySelector('[aria-invalid="true"]')?.focus(); return; }
          adminSaveTitle({ id: existing?.id, title: name.value.trim(), mediaType: type.value, releaseDate: date.value });
          demoToast(existing ? 'Title updated' : 'Title added');
          close();
          paintAll();
        });
      },
    });
  }

  function openGenreForm(id) {
    const existing = id ? state.genres.find((g) => g.id === Number(id)) : null;
    openModal({
      title: existing ? 'Rename genre' : 'Add genre',
      size: 'sm',
      bodyHtml: `
        <form id="genre-form" novalidate>
          ${fieldHtml({ id: 'gf-name', label: 'Genre name', value: existing?.name ?? '', maxlength: 30 })}
          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" data-modal-cancel>Cancel</button>
            <button type="submit" class="btn btn-primary">${existing ? 'Save' : 'Add genre'}</button>
          </div>
        </form>`,
      onMount: (dialog, close) => {
        const form = dialog.querySelector('#genre-form');
        const name = form.querySelector('#gf-name');
        dialog.querySelector('[data-modal-cancel]').addEventListener('click', () => close());
        form.addEventListener('submit', (event) => {
          event.preventDefault();
          const value = name.value.trim();
          const duplicate = state.genres.some((g) => g.name.toLowerCase() === value.toLowerCase() && g.id !== existing?.id);
          const message = !value ? 'Please enter a genre name.' : value.length < 2 ? 'The name needs at least 2 characters.' : duplicate ? 'A genre with this name already exists.' : '';
          if (!setFieldError(name, message)) { name.focus(); return; }
          adminSaveGenre({ id: existing?.id, name: value });
          demoToast(existing ? 'Genre renamed' : 'Genre added');
          close();
          paintAll();
        });
      },
    });
  }

  // ---------- events ----------
  page.addEventListener('click', async (event) => {
    const tab = event.target.closest('[data-tab]');
    if (tab) { view.tab = tab.dataset.tab; view.filter = ''; paintAll(); page.querySelector(`[data-tab="${view.tab}"]`)?.focus(); return; }

    if (event.target.closest('[data-title-add]')) { openTitleForm(); return; }
    if (event.target.closest('[data-genre-add]')) { openGenreForm(); return; }

    // For a click on <button data-user-delete="4">, hit('user-delete') returns "4".
    // It returns undefined when the click was not on a button with that attribute.
    const hit = (attr) => event.target.closest(`[data-${attr}]`)?.getAttribute(`data-${attr}`);

    const titleEdit = hit('title-edit');
    if (titleEdit) { openTitleForm(titleEdit); return; }

    const genreEdit = hit('genre-edit');
    if (genreEdit) { openGenreForm(genreEdit); return; }

    const roleId = hit('user-role');
    if (roleId) {
      const user = state.users.find((u) => u.id === Number(roleId));
      const next = user.role === 'admin' ? 'user' : 'admin';
      if (await confirmDialog({ title: 'Change role?', message: `${user.name} will become ${next === 'admin' ? 'an admin' : 'a regular user'}.`, confirmLabel: 'Change role', danger: false })) {
        adminSetUserRole(user.id, next);
        demoToast(`${user.name} is now ${next === 'admin' ? 'an admin' : 'a user'}`);
        paintAll();
      }
      return;
    }

    const activeId = hit('user-active');
    if (activeId) {
      adminToggleUserActive(activeId);
      const user = state.users.find((u) => u.id === Number(activeId));
      demoToast(`${user.name} is now ${user.active ? 'active' : 'inactive'}`);
      paintAll();
      return;
    }

    const userDelete = hit('user-delete');
    if (userDelete) {
      const user = state.users.find((u) => u.id === Number(userDelete));
      const theirReviews = state.otherReviews.filter((r) => r.userId === user.id).length;
      if (await confirmDialog({ title: 'Delete user?', message: `${user.name} will be deleted together with ${plural(theirReviews, 'review')} and their watchlist. This cannot be undone.`, confirmLabel: 'Delete user' })) {
        adminDeleteUser(user.id);
        demoToast(`Deleted ${user.name}`);
        paintAll();
      }
      return;
    }

    const titleDelete = hit('title-delete');
    if (titleDelete) {
      const title = getTitle(titleDelete);
      const lists = state.watchlist.filter((w) => w.titleId === title.id).length;
      const reviews = [...state.reviews, ...state.otherReviews].filter((r) => r.titleId === title.id).length;
      if (await confirmDialog({ title: 'Delete title?', message: `"${title.title}" will be deleted. This also removes ${plural(lists, 'watchlist entry')} and ${plural(reviews, 'review')} that refer to it, so nothing is left orphaned.`, confirmLabel: 'Delete title' })) {
        adminDeleteTitle(title.id);
        demoToast(`Deleted "${title.title}"`);
        paintAll();
      }
      return;
    }

    const genreDelete = hit('genre-delete');
    if (genreDelete) {
      const genre = state.genres.find((g) => g.id === Number(genreDelete));
      const used = state.titles.filter((t) => t.genreIds.includes(genre.id)).length;
      if (await confirmDialog({ title: 'Delete genre?', message: `"${genre.name}" will be deleted and removed from ${plural(used, 'title')}. The titles themselves stay.`, confirmLabel: 'Delete genre' })) {
        adminDeleteGenre(genre.id);
        demoToast(`Deleted genre "${genre.name}"`);
        paintAll();
      }
      return;
    }

    const reviewDelete = hit('review-delete');
    if (reviewDelete) {
      if (await confirmDialog({ title: 'Delete review?', message: 'Removing a review is a moderation action and cannot be undone.', confirmLabel: 'Delete review' })) {
        deleteReview(reviewDelete);
        demoToast('Review deleted');
        paintAll();
      }
    }
  });

  page.addEventListener('input', (event) => {
    if (event.target.id === 'admin-filter') { view.filter = event.target.value; paintTable(); }
  });

  paintAll();
}
