/** Profile: summary, edit form and a placeholder for preferences. Saving is demo-only until a later milestone. */
import { mountPage, formatDate, initials, isValidEmail } from '../js/utils/dom.js';
import { setFieldError } from '../js/utils/forms.js';
import { demoToast } from '../js/components/toast.js';
import { renderTemplate, bindText } from '../js/services/template-service.js';
import { state, watchlistStats, saveProfile } from '../js/state.js';

const BIO_MAX = 200;

export function renderProfileView(container) {
  const page = mountPage(container);

  function paint() {
    const { profile } = state;
    const stats = watchlistStats();

    renderTemplate(page, 'profile'); // static layout lives in views/profile.html
    bindText(page, {
      initials: initials(profile.name),
      name: profile.name,
      email: profile.email,
      bio: profile.bio || 'No bio yet.',
      role: state.role === 'admin' ? 'Admin (preview)' : 'User',
      memberSince: formatDate(profile.joinedAt),
      watchlistCount: `${stats.total} titles`,
      completedCount: stats.completed,
      reviewCount: stats.reviews,
    });
    if (!profile.bio) page.querySelector('[data-bind="bio"]').classList.add('muted');
    page.querySelector('#pf-name').value = profile.name;
    page.querySelector('#pf-email').value = profile.email;
    page.querySelector('#pf-bio').value = profile.bio ?? '';
    page.querySelector('#pf-bio').maxLength = BIO_MAX;

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
