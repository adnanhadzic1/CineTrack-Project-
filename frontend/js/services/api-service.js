/**
 * API service. In the final architecture, ONLY files in js/services/ talk to the backend:
 *
 *   view -> service (this folder) -> fetch() -> FlightPHP route -> middleware -> service -> DAO -> MySQL
 *
 * Milestone 3: the backend exists, but the app is still connected to it in ONE place only:
 * searchExternalTitles() below (the "Search TMDB" panel on Discover). Everything else still uses the mock
 * data, so apiRequest() stays switched off (API_CONFIG.enabled = false) until M4 connects the rest.
 *
 * Planned usage from M4:
 *   const titles = await apiRequest('/titles?search=moon');
 *   const created = await apiRequest('/watchlist-items', { method: 'POST', body: { userId: 1, titleId: 5 } });
 */

export const API_CONFIG = {
  enabled: false,                 // set to true in M4, when the backend is connected
  baseUrl: 'http://localhost:8001', // the FlightPHP backend (php -S localhost:8001 -t backend/public)
};

export class ApiNotAvailableError extends Error {
  constructor() {
    super('The CineTrack API is not connected to this part of the app yet (planned for Milestone 4).');
    this.name = 'ApiNotAvailableError';
  }
}

/**
 * Single place that will attach the JWT and handle 401/403 responses (M4).
 * The token must be kept in memory or a secure storage choice made in M4 - never hard-coded here.
 */
export async function apiRequest(path, { method = 'GET', body = null } = {}) {
  if (!API_CONFIG.enabled || !API_CONFIG.baseUrl) throw new ApiNotAvailableError();

  const response = await fetch(`${API_CONFIG.baseUrl}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: body ? JSON.stringify(body) : null,
  });
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
  return response.json();
}

/**
 * Milestone 3: search TMDB through OUR backend (GET /external/titles/search).
 * This is the only backend call in the frontend so far; the rest of the app still uses mock data until M4,
 * which is why API_CONFIG.enabled stays false. Returns { results, page, totalPages, totalResults }.
 */
export async function searchExternalTitles(query) {
  let response;
  try {
    response = await fetch(`${API_CONFIG.baseUrl}/external/titles/search?query=${encodeURIComponent(query)}`, {
      headers: { Accept: 'application/json' },
    });
  } catch {
    throw new Error('The CineTrack backend is not reachable. Start it and try again.');
  }
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.success) throw new Error(body?.message || `Request failed with status ${response.status}`);
  return body.data;
}
