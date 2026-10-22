/** Registration screen. PROTOTYPE: validates the form only; no account is created and nothing is stored. */
import { authLayout } from '../components/auth-layout.js';
import { fieldHtml, passwordFieldHtml, setFieldError, wirePasswordToggles } from '../utils/forms.js';
import { isValidEmail } from '../utils/dom.js';
import { navigate } from '../router.js';
import { showToast } from '../components/toast.js';

export function renderRegisterView(container) {
  container.innerHTML = authLayout(`
    <h1>Create your account</h1>
    <p class="muted">Start tracking what you watch.</p>
    <p class="notice" role="note"><strong>Prototype:</strong> no account is created and nothing is stored. Real registration with hashed passwords arrives in Milestone 4.</p>

    <form id="register-form" novalidate>
      ${fieldHtml({ id: 'reg-name', label: 'Name', autocomplete: 'name', placeholder: 'Your name', maxlength: 60 })}
      ${fieldHtml({ id: 'reg-email', label: 'Email', type: 'email', autocomplete: 'email', placeholder: 'you@example.com' })}
      ${passwordFieldHtml({ id: 'reg-password', label: 'Password', autocomplete: 'new-password', hint: 'At least 8 characters, with a letter and a number.' })}
      ${passwordFieldHtml({ id: 'reg-confirm', label: 'Confirm password', autocomplete: 'new-password' })}
      <button type="submit" class="btn btn-primary btn-block">Create account</button>
    </form>

    <p class="auth-switch">Already have an account? <a href="#/login">Log in</a></p>`);

  const form = container.querySelector('#register-form');
  const name = form.querySelector('#reg-name');
  const email = form.querySelector('#reg-email');
  const password = form.querySelector('#reg-password');
  const confirm = form.querySelector('#reg-confirm');
  wirePasswordToggles(form);

  const checks = {
    name: () => {
      const v = name.value.trim();
      return setFieldError(name, !v ? 'Please enter your name.' : v.length < 2 ? 'Your name needs at least 2 characters.' : '');
    },
    email: () => {
      const v = email.value.trim();
      return setFieldError(email, !v ? 'Please enter your email.' : !isValidEmail(v) ? 'Please enter a valid email address, like name@example.com.' : '');
    },
    password: () => {
      const v = password.value;
      const message = !v ? 'Please choose a password.'
        : v.length < 8 ? 'Your password needs at least 8 characters.'
        : !/[A-Za-z]/.test(v) || !/\d/.test(v) ? 'Your password needs at least one letter and one number.' : '';
      return setFieldError(password, message);
    },
    confirm: () => setFieldError(confirm, !confirm.value ? 'Please repeat your password.' : confirm.value !== password.value ? 'The passwords do not match.' : ''),
  };
  name.addEventListener('blur', checks.name);
  email.addEventListener('blur', checks.email);
  password.addEventListener('blur', checks.password);
  confirm.addEventListener('blur', checks.confirm);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const results = Object.values(checks).map((check) => check()); // run every check so all messages show
    if (results.includes(false)) { form.querySelector('[aria-invalid="true"]')?.focus(); return; }
    password.value = '';
    confirm.value = '';
    showToast('Prototype only: no account was created. You can log in with the demo form.', 'info');
    navigate('/login');
  });
}
