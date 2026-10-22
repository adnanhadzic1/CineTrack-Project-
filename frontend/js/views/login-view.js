/** Login screen. PROTOTYPE: the form is validated, but no credentials are checked, stored or sent anywhere. */
import { authLayout } from '../components/auth-layout.js';
import { fieldHtml, passwordFieldHtml, setFieldError, wirePasswordToggles } from '../utils/forms.js';
import { isValidEmail } from '../utils/dom.js';
import { navigate } from '../router.js';
import { showToast } from '../components/toast.js';

export function renderLoginView(container) {
  container.innerHTML = authLayout(`
    <h1>Welcome back</h1>
    <p class="muted">Log in to continue to your watchlist.</p>
    <p class="notice" role="note"><strong>Prototype:</strong> this form does not log you in. Real authentication with JWT arrives in Milestone 4.</p>

    <form id="login-form" novalidate>
      ${fieldHtml({ id: 'login-email', label: 'Email', type: 'email', autocomplete: 'email', placeholder: 'you@example.com' })}
      ${passwordFieldHtml({ id: 'login-password', label: 'Password', autocomplete: 'current-password' })}
      <button type="submit" class="btn btn-primary btn-block">Log in</button>
    </form>

    <p class="auth-switch">New to CineTrack? <a href="#/register">Create an account</a></p>
    <p class="auth-switch"><a href="#/dashboard">Skip and explore the demo</a></p>`);

  const form = container.querySelector('#login-form');
  const email = form.querySelector('#login-email');
  const password = form.querySelector('#login-password');
  wirePasswordToggles(form);

  const checkEmail = () => setFieldError(email, !email.value.trim() ? 'Please enter your email.' : !isValidEmail(email.value.trim()) ? 'Please enter a valid email address, like name@example.com.' : '');
  const checkPassword = () => setFieldError(password, password.value ? '' : 'Please enter your password.');
  email.addEventListener('blur', checkEmail);
  password.addEventListener('blur', checkPassword);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const emailOk = checkEmail();
    const passwordOk = checkPassword();
    if (!emailOk) { email.focus(); return; }
    if (!passwordOk) { password.focus(); return; }
    password.value = ''; // never keep the typed password around
    showToast('Prototype only: no credentials were checked. Showing the demo dashboard.', 'info');
    navigate('/dashboard');
  });
}
