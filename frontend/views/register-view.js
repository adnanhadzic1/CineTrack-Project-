/** Registration screen. PROTOTYPE: validates the form only; no account is created and nothing is stored. */
import { authLayout } from '../js/components/auth-layout.js';
import { setFieldError, wirePasswordToggles } from '../js/utils/forms.js';
import { isValidEmail } from '../js/utils/dom.js';
import { navigate } from '../js/router.js';
import { showToast } from '../js/components/toast.js';
import { getTemplate } from '../js/services/template-service.js';

export function renderRegisterView(container) {
  container.innerHTML = authLayout(getTemplate('register')); // markup lives in views/register.html

  const form = container.querySelector('#register-form');
  const name = form.querySelector('#reg-name');
  const email = form.querySelector('#reg-email');
  const password = form.querySelector('#reg-password');
  const confirm = form.querySelector('#reg-confirm');
  wirePasswordToggles(form);

  const checks = {
    name: () => {
      const value = name.value.trim();
      let message = '';
      if (!value) {
        message = 'Please enter your name.';
      } else if (value.length < 2) {
        message = 'Your name needs at least 2 characters.';
      }
      return setFieldError(name, message);
    },
    email: () => {
      const value = email.value.trim();
      let message = '';
      if (!value) {
        message = 'Please enter your email.';
      } else if (!isValidEmail(value)) {
        message = 'Please enter a valid email address, like name@example.com.';
      }
      return setFieldError(email, message);
    },
    password: () => {
      const value = password.value;
      let message = '';
      if (!value) {
        message = 'Please choose a password.';
      } else if (value.length < 8) {
        message = 'Your password needs at least 8 characters.';
      } else if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
        message = 'Your password needs at least one letter and one number.';
      }
      return setFieldError(password, message);
    },
    confirm: () => {
      let message = '';
      if (!confirm.value) {
        message = 'Please repeat your password.';
      } else if (confirm.value !== password.value) {
        message = 'The passwords do not match.';
      }
      return setFieldError(confirm, message);
    },
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
    showToast('No account was created (prototype). You can still try the demo login.', 'info');
    navigate('/login');
  });
}
