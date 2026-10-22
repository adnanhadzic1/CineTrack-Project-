/** Profile: summary, edit form and a placeholder for preferences. Saving is demo-only until a later milestone. */
import { esc, mountPage, formatDate, initials, isValidEmail } from '../utils/dom.js';
import { fieldHtml, setFieldError } from '../utils/forms.js';
import { demoToast } from '../components/toast.js';
import { state, watchlistStats, saveProfile } from '../state.js';

const BIO_MAX = 200;

export function renderProfileView(container) {
  const page = mountPage(container);

  function paint() {
    const { profile } = state;
    const stats = watchlistStats();

    page.innerHTML = `
      <header class="page-head">
        <div>
          <h1 class="page-title">Profile</h1>
          <p class="muted">Your account details and preferences.</p>
        </div>
      </header>
      <p class="notice" role="note"><strong>Prototype.</strong> Edits update this page for the current session only. Saving your profile to the database arrives in a later milestone.</p>

      <div class="profile-grid">
        <section class="panel profile-summary" aria-labelledby="summary-title">
          <span class="avatar avatar-lg" aria-hidden="true">${esc(initials(profile.name))}</span>
          <h2 id="summary-title">${esc(profile.name)}</h2>
          <p class="muted">${esc(profile.email)}</p>
          <p class="profile-bio">${esc(profile.bio) || '<span class="muted">No bio yet.</span>'}</p>
          <dl class="profile-facts">
            <div><dt>Role</dt><dd>${state.role === 'admin' ? 'Admin (preview)' : 'User'}</dd></div>
            <div><dt>Member since</dt><dd>${formatDate(profile.joinedAt)}</dd></div>
            <div><dt>Watchlist</dt><dd>${stats.total} titles</dd></div>
            <div><dt>Completed</dt><dd>${stats.completed}</dd></div>
            <div><dt>Reviews</dt><dd>${stats.reviews}</dd></div>
          </dl>
        </section>

        <div class="profile-forms">
          <section class="panel" aria-labelledby="edit-title">
            <h2 id="edit-title" class="panel-title">Edit profile</h2>
            <form id="profile-form" novalidate>
              ${fieldHtml({ id: 'pf-name', label: 'Name', value: profile.name, autocomplete: 'name', maxlength: 60 })}
              ${fieldHtml({ id: 'pf-email', label: 'Email', type: 'email', value: profile.email, autocomplete: 'email' })}
              <div class="field">
                <label for="pf-bio">Bio <span class="muted">(optional)</span></label>
                <textarea id="pf-bio" rows="3" maxlength="${BIO_MAX}" aria-describedby="pf-bio-count pf-bio-error" aria-invalid="false">${esc(profile.bio)}</textarea>
                <p class="field-hint" id="pf-bio-count"></p>
                <p class="field-error" id="pf-bio-error" hidden></p>
              </div>
              <div class="form-actions">
                <button type="submit" class="btn btn-primary">Save changes</button>
                <button type="button" class="btn btn-ghost" id="pf-reset">Reset</button>
              </div>
            </form>
          </section>

          <section class="panel" aria-labelledby="prefs-title">
            <h2 id="prefs-title" class="panel-title">Account preferences</h2>
            <p class="muted">Placeholder: these controls are switched off in Milestone 1 and are planned for a later milestone.</p>
            <ul class="pref-list">
              <li><label><input type="checkbox" disabled> Hide spoilers in reviews</label></li>
              <li><label><input type="checkbox" disabled> Show ratings on poster cards</label></li>
              <li><label for="pref-view">Default watchlist view</label>
                <select id="pref-view" disabled><option>List</option></select></li>
            </ul>
            <button type="button" class="btn btn-secondary" disabled>Change password</button>
            <p class="field-hint">Password changes need real accounts, which arrive with authentication in Milestone 4.</p>
          </section>
        </div>
      </div>`;

    const form = page.querySelector('#profile-form');
    const name = form.querySelector('#pf-name');
    const email = form.querySelector('#pf-email');
    const bio = form.querySelector('#pf-bio');
    const bioCount = form.querySelector('#pf-bio-count');
    const updateCount = () => { bioCount.textContent = `${bio.value.length} / ${BIO_MAX} characters`; };
    updateCount();
    bio.addEventListener('input', updateCount);

    const checkName = () => setFieldError(name, !name.value.trim() ? 'Please enter your name.' : name.value.trim().length < 2 ? 'Your name needs at least 2 characters.' : '');
    const checkEmail = () => setFieldError(email, !email.value.trim() ? 'Please enter your email.' : !isValidEmail(email.value.trim()) ? 'Please enter a valid email address, like name@example.com.' : '');
    name.addEventListener('blur', checkName);
    email.addEventListener('blur', checkEmail);

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const results = [checkName(), checkEmail()];
      if (results.includes(false)) { form.querySelector('[aria-invalid="true"]')?.focus(); return; }
      saveProfile({ name: name.value.trim(), email: email.value.trim(), bio: bio.value.trim() });
      demoToast('Profile updated');
      paint();
    });

    form.querySelector('#pf-reset').addEventListener('click', () => paint());
  }

  paint();
}
