/** Reviews: the demo user's reviews, with create / edit / delete. Demo state only. */
import { esc, mountPage, formatDate, typeLabel } from '../js/utils/dom.js';
import { icon } from '../js/components/icons.js';
import { emptyState } from '../js/components/feedback.js';
import { posterHtml, starsHtml } from '../js/components/movie-card.js';
import { confirmDialog } from '../js/components/modal.js';
import { openReviewForm } from '../js/components/review-form.js';
import { openTitleDetails } from '../js/components/title-modal.js';
import { demoToast } from '../js/components/toast.js';
import { renderTemplate, bindText, bindHtml } from '../js/services/template-service.js';
import { state, getTitle, releaseYear, deleteReview } from '../js/state.js';

export function renderReviewsView(container) {
  const page = mountPage(container);

  function reviewHtml(review) {
    const title = getTitle(review.titleId);
    const edited = review.updatedAt !== review.createdAt;
    return `
      <li class="review-card">
        <button type="button" class="review-poster" data-open-title="${title.id}" aria-label="View details for ${esc(title.title)}">${posterHtml(title)}</button>
        <div class="review-body">
          <div class="review-head">
            <h3>${esc(title.title)}</h3>
            ${starsHtml(review.rating)}
          </div>
          <p class="muted">${typeLabel(title.mediaType)} · ${releaseYear(title)} · reviewed <time datetime="${esc(review.createdAt)}">${formatDate(review.createdAt)}</time>${edited ? ` · edited ${formatDate(review.updatedAt)}` : ''}</p>
          <p class="review-text">${esc(review.text)}</p>
        </div>
        <div class="review-actions">
          <button type="button" class="btn btn-ghost btn-sm" data-edit-review="${review.id}" aria-label="Edit your review of ${esc(title.title)}">${icon('edit', 16)} Edit</button>
          <button type="button" class="btn btn-ghost btn-sm btn-danger-text" data-delete-review="${review.id}" aria-label="Delete your review of ${esc(title.title)}">${icon('trash', 16)} Delete</button>
        </div>
      </li>`;
  }

  function paint() {
    const reviews = [...state.reviews].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id);
    const average = reviews.length ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : null;

    renderTemplate(page, 'reviews'); // static layout lives in views/reviews.html
    bindText(page, {
      subtitle: reviews.length
        ? `${reviews.length} review${reviews.length === 1 ? '' : 's'} · your average rating is ${average} out of 5`
        : 'Rate what you have watched and keep a few notes for later.',
    });
    bindHtml(page, {
      list: reviews.length
        ? `<ul class="review-list">${reviews.map(reviewHtml).join('')}</ul>`
        : emptyState({
            iconName: 'star',
            title: 'No reviews yet',
            text: 'Write your first review to remember what you thought of a title.',
            actionHtml: '<button type="button" class="btn btn-primary" data-new-review>Write a review</button>',
          }),
    });
  }

  page.addEventListener('click', async (event) => {
    if (event.target.closest('[data-new-review]')) { openReviewForm({ onSaved: paint }); return; }

    const edit = event.target.closest('[data-edit-review]');
    if (edit) { openReviewForm({ reviewId: edit.dataset.editReview, onSaved: paint }); return; }

    const open = event.target.closest('[data-open-title]');
    if (open) { openTitleDetails(open.dataset.openTitle, paint); return; }

    const remove = event.target.closest('[data-delete-review]');
    if (remove) {
      const review = state.reviews.find((r) => r.id === Number(remove.dataset.deleteReview));
      const title = getTitle(review.titleId);
      const ok = await confirmDialog({ title: 'Delete this review?', message: `Your review of "${title.title}" will be deleted.`, confirmLabel: 'Delete review' });
      if (ok) {
        deleteReview(review.id);
        demoToast('Review deleted');
        paint();
      }
    }
  });

  paint();
}
