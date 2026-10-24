/**
 * Modal dialog + confirmation dialog.
 * Handles: Escape to close, click on the backdrop to close, focus moves into the dialog,
 * Tab stays inside the dialog, and focus returns to the button that opened it.
 */
import { esc } from '../utils/dom.js';

let current = null; // { backdrop, onClose, lastFocus, keyHandler }

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function openModal({ title, bodyHtml, size = 'md', onMount, onClose }) {
  closeModal();

  const root = document.getElementById('modal-root');
  const lastFocus = document.activeElement;

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal modal-${size}" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <header class="modal-head">
        <h2 id="modal-title">${esc(title)}</h2>
        <button type="button" class="icon-btn" data-modal-close aria-label="Close dialog">&times;</button>
      </header>
      <div class="modal-body">${bodyHtml}</div>
    </div>`;
  root.appendChild(backdrop);
  document.body.classList.add('modal-open');

  const dialog = backdrop.querySelector('.modal');

  backdrop.addEventListener('mousedown', (event) => { if (event.target === backdrop) closeModal(); });
  dialog.querySelector('[data-modal-close]').addEventListener('click', () => closeModal());

  const keyHandler = (event) => {
    if (event.key === 'Escape') { event.preventDefault(); closeModal(); return; }
    if (event.key !== 'Tab') return;
    const items = [...dialog.querySelectorAll(FOCUSABLE)];
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };
  document.addEventListener('keydown', keyHandler);

  current = { backdrop, onClose, lastFocus, keyHandler };
  if (onMount) onMount(dialog, closeModal);

  // Focus the first form control if there is one, otherwise the close button.
  (dialog.querySelector('.modal-body input, .modal-body select, .modal-body textarea, .modal-body button') ?? dialog.querySelector('[data-modal-close]')).focus();
  return dialog;
}

export function closeModal() {
  if (!current) return;
  const { backdrop, onClose, lastFocus, keyHandler } = current;
  current = null;
  document.removeEventListener('keydown', keyHandler);
  backdrop.remove();
  document.body.classList.remove('modal-open');
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  if (onClose) onClose();
}

/** Confirmation dialog for destructive actions. Resolves to true (confirmed) or false. */
export function confirmDialog({ title, message, confirmLabel = 'Delete', danger = true }) {
  return new Promise((resolve) => {
    let answered = false;
    const answer = (value) => { if (!answered) { answered = true; resolve(value); } };

    openModal({
      title,
      size: 'sm',
      bodyHtml: `
        <p class="confirm-text">${esc(message)}</p>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" data-confirm="no">Cancel</button>
          <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-confirm="yes">${esc(confirmLabel)}</button>
        </div>`,
      onMount: (dialog, close) => {
        dialog.querySelector('[data-confirm="no"]').addEventListener('click', () => close());
        dialog.querySelector('[data-confirm="yes"]').addEventListener('click', () => { answer(true); close(); });
      },
      onClose: () => answer(false),
    });
  });
}
