/** Form helpers: field errors and the show/hide password button. */
import { esc } from './dom.js';
import { icon } from '../components/icons.js';

/**
 * Show or clear the error message of one input.
 * The input must have an id, and the matching message element must have id "<input id>-error".
 * Returns true when the field is valid (message empty).
 */
export function setFieldError(input, message) {
  const error = document.getElementById(`${input.id}-error`);
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
  if (error) {
    error.textContent = message || '';
    error.hidden = !message;
  }
  return !message;
}

/** Markup for a labelled text-like input with an error slot. */
export function fieldHtml({ id, label, type = 'text', value = '', autocomplete = 'off', placeholder = '', hint = '', maxlength = '' }) {
  return `
    <div class="field">
      <label for="${id}">${esc(label)}</label>
      <input id="${id}" name="${id}" type="${type}" value="${esc(value)}" autocomplete="${autocomplete}"
             placeholder="${esc(placeholder)}" ${maxlength ? `maxlength="${maxlength}"` : ''}
             aria-describedby="${id}-error${hint ? ` ${id}-hint` : ''}" aria-invalid="false">
      ${hint ? `<p class="field-hint" id="${id}-hint">${esc(hint)}</p>` : ''}
      <p class="field-error" id="${id}-error" hidden></p>
    </div>`;
}

/** Markup for a password input with a show/hide button (wire it with wirePasswordToggles). */
export function passwordFieldHtml({ id, label, autocomplete, hint = '' }) {
  return `
    <div class="field">
      <label for="${id}">${esc(label)}</label>
      <div class="input-group">
        <input id="${id}" name="${id}" type="password" autocomplete="${autocomplete}"
               aria-describedby="${id}-error${hint ? ` ${id}-hint` : ''}" aria-invalid="false">
        <button type="button" class="input-group-btn" data-toggle-password="${id}" aria-pressed="false" aria-label="Show password">
          ${icon('eye', 18)}
        </button>
      </div>
      ${hint ? `<p class="field-hint" id="${id}-hint">${esc(hint)}</p>` : ''}
      <p class="field-error" id="${id}-error" hidden></p>
    </div>`;
}

export function wirePasswordToggles(root) {
  root.querySelectorAll('[data-toggle-password]').forEach((button) => {
    button.addEventListener('click', () => {
      const input = root.querySelector(`#${button.dataset.togglePassword}`);
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      button.setAttribute('aria-pressed', String(show));
      button.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      button.innerHTML = icon(show ? 'eyeOff' : 'eye', 18);
    });
  });
}
