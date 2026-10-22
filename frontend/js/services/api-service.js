/**
 * API service - FOUNDATION ONLY (Milestone 1).
 *
 * In the final architecture, ONLY files in js/services/ talk to the backend:
 *
 *   view -> service (this folder) -> fetch() -> FlightPHP route -> middleware -> service -> DAO -> MySQL
 *
 * The REST API does not exist yet, so nothing in M1 imports this file and every request fails
 * on purpose. That way the prototype can never pretend that data came from a server.
 *
 * Planned usage from M4 (do not add before the backend exists):
 *   const titles = await apiRequest('/titles?search=moon');
 *   const created = await apiRequest('/watchlist', { method: 'POST', body: { titleId: 5 } });
 */

export const API_CONFIG = {
  enabled: false,                 // set to true in M4, when the backend is connected
  baseUrl: null,                  // e.g. 'http://localhost:8000' - decided in M3/M4
};

export class ApiNotAvailableError extends Error {
  constructor() {
    super('The CineTrack API is not available yet (Milestone 1 is a static prototype).');
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
