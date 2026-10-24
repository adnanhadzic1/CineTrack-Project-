/**
 * Minimal hash router.
 *
 * URLs look like  index.html#/discover?q=moon
 * Changing the part after "#" never reloads the page, which is what makes this a single-page app.
 * It also works on any static file server, because the server never sees the hash.
 */

export function parseHash() {
  const raw = window.location.hash.replace(/^#/, '') || '/dashboard';
  const [path, queryString = ''] = raw.split('?');
  return { path: path || '/dashboard', query: new URLSearchParams(queryString) };
}

export function navigate(path, query) {
  const params = query ? new URLSearchParams(query).toString() : '';
  window.location.hash = params ? `${path}?${params}` : path;
}

/** Calls render(route) once now and again every time the hash changes. */
export function startRouter(render) {
  window.addEventListener('hashchange', () => render(parseHash()));
  render(parseHash());
}
