/** Login screen. PROTOTYPE: the form is validated, but no credentials are checked, stored or sent anywhere. */
import { authLayout } from '../js/components/auth-layout.js';
import { setFieldError, wirePasswordToggles } from '../js/utils/forms.js';
import { isValidEmail } from '../js/utils/dom.js';
import { navigate } from '../js/router.js';
import { showToast } from '../js/components/toast.js';
import { getTemplate } from '../js/services/template-service.js';

export function renderLoginView(container) {
  container.innerHTML = authLayout(getTemplate('login')); // markup lives in views/login.html

  const form = container.querySelector('#login-form');
  const email = form.querySelector('#login-email');
  const password = form.querySelector('#login-password');
  wirePasswordToggles(form);

  // Each check shows or clears the error under its field and returns true when the field is valid.
  const checkEmail = () => {
    const value = email.value.trim();
    let message = '';
    if (!value) {
      message = 'Please enter your email.';
    } else if (!isValidEmail(value)) {
      message = 'Please enter a valid email address, like name@example.com.';
    }
    return setFieldError(email, message);
  };
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
    showToast('Demo mode: you are not really logged in.', 'info');
    navigate('/dashboard');
  });
}
