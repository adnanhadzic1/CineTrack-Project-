/** Two-panel layout shared by the login and registration screens. */
import { icon } from './icons.js';

export function authLayout(formPanelHtml) {
  return `
    <div class="auth-layout">
      <section class="auth-aside" aria-hidden="true">
        <a class="brand" href="#/login" tabindex="-1"><span class="brand-mark">${icon('play', 18)}</span><span class="brand-name">CineTrack</span></a>
        <h2>Your personal movie and TV diary.</h2>
        <ul class="auth-points">
          <li>${icon('list', 18)} Keep one watchlist for movies and series</li>
          <li>${icon('check', 18)} Mark titles as planned, watching or completed</li>
          <li>${icon('star', 18)} Rate and review what you have seen</li>
        </ul>
      </section>
      <section class="auth-panel">
        <div class="auth-card">
          ${formPanelHtml}
        </div>
      </section>
    </div>`;
}
