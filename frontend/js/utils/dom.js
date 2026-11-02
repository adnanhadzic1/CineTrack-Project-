/** Small helpers shared by all views and components. */

/** Escape text before putting it into an HTML string, so user input can never inject markup. */
export const esc = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/**
 * Every app view draws into its own wrapper element. The router clears the wrapper when you leave the
 * page, so event listeners attached to it are thrown away too and never pile up on the shared container.
 */
export function mountPage(container, className = 'page') {
  const page = document.createElement('div');
  page.className = className;
  container.appendChild(page);
  return page;
}

export function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export function initials(name) {
  return String(name).trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || '?';
}

export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const typeLabel = (mediaType) => (mediaType === 'tv' ? 'TV show' : 'Movie');
