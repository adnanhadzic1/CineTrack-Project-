/**
 * Loads the HTML templates from frontend/views/ and fills them with data.
 *
 * This file only reads static files that ship with the frontend (views/*.html). It does not talk to the
 * backend. All templates are fetched once, before the first screen is drawn, so views can use them
 * synchronously and moving between pages still never reloads the browser.
 *
 * Template conventions (see the .html files):
 *   <span data-icon="plus" data-size="18"></span>  -> replaced by the inline SVG icon
 *   data-bind="name"                               -> text set with bindText() (safe, no HTML)
 *   data-slot="name"                               -> HTML set with bindHtml() (only for markup we build with esc())
 */
import { icon } from '../components/icons.js';

const TEMPLATE_NAMES = ['login', 'register', 'dashboard', 'discover', 'watchlist', 'reviews', 'profile', 'admin', 'admin-forbidden'];
const cache = new Map();

export async function loadTemplates() {
  await Promise.all(TEMPLATE_NAMES.map(async (name) => {
    const response = await fetch(`views/${name}.html`);
    if (!response.ok) throw new Error(`Template views/${name}.html could not be loaded (${response.status}).`);
    cache.set(name, await response.text());
  }));
}

/** The raw template markup, with icon placeholders already replaced. */
export function getTemplate(name) {
  if (!cache.has(name)) throw new Error(`Unknown template "${name}".`);
  const holder = document.createElement('div');
  holder.innerHTML = cache.get(name);
  fillIcons(holder);
  return holder.innerHTML;
}

/** Draw a template into an element. */
export function renderTemplate(target, name) {
  target.innerHTML = getTemplate(name);
}

export function fillIcons(root) {
  root.querySelectorAll('[data-icon]').forEach((placeholder) => {
    const holder = document.createElement('template');
    holder.innerHTML = icon(placeholder.dataset.icon, Number(placeholder.dataset.size) || 18);
    placeholder.replaceWith(holder.content);
  });
}

export function bindText(root, values) {
  Object.entries(values).forEach(([name, value]) => {
    root.querySelectorAll(`[data-bind="${name}"]`).forEach((el) => { el.textContent = value; });
  });
}

export function bindHtml(root, values) {
  Object.entries(values).forEach(([name, html]) => {
    root.querySelectorAll(`[data-slot="${name}"]`).forEach((el) => { el.innerHTML = html; });
  });
}
