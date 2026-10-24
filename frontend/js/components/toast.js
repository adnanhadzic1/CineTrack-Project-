/** Toast notifications. type: 'info' | 'success' | 'error' */
import { esc } from '../utils/dom.js';

export function showToast(message, type = 'info', durationMs = 4500) {
  const root = document.getElementById('toast-root');
  if (!root) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-message">${esc(message)}</span>
    <button type="button" class="toast-close" aria-label="Dismiss notification">&times;</button>`;

  const remove = () => toast.remove();
  toast.querySelector('.toast-close').addEventListener('click', remove);
  root.appendChild(toast);
  if (durationMs > 0) setTimeout(remove, durationMs);
}

/** Every simulated action uses this wording so nobody thinks data was really saved. */
export const demoToast = (message) => showToast(`${message} (demo, not saved)`, 'success');
