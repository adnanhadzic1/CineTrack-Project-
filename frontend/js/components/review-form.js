/** Create / edit review form (modal). Used by the Reviews page, the Watchlist and the title details modal. */
import { esc, typeLabel } from '../utils/dom.js';
import { setFieldError } from '../utils/forms.js';
import { openModal } from './modal.js';
import { demoToast, showToast } from './toast.js';
import { state, getTitle, getReviewByTitle, saveReview, releaseYear } from '../state.js';

const MIN_TEXT = 10;
const MAX_TEXT = 1000;

/**
 * Open the review form.
 *  - reviewId given            -> edit that review
 *  - titleId given, review ex. -> edit the existing review (one review per title, like the planned DB rule)
 *  - otherwise                 -> create a new review (title chosen from titles you have not reviewed yet)
 */
export function openReviewForm({ titleId = null, reviewId = null, onSaved = () => {} } = {}) {
  const existing = reviewId
    ? state.reviews.find((r) => r.id === Number(reviewId))
    : titleId ? getReviewByTitle(titleId) : null;
  const lockedTitle = existing ? getTitle(existing.titleId) : titleId ? getTitle(titleId) : null;

  const reviewedIds = new Set(state.reviews.map((r) => r.titleId));
  const choices = state.titles.filter((t) => !reviewedIds.has(t.id));
  if (!existing && !lockedTitle && choices.length === 0) {
    showToast('You have already reviewed every available title.', 'info');
    return;
  }

  const titleField = lockedTitle
    ? `<p class="form-title"><strong>${esc(lockedTitle.title)}</strong> <span class="muted">· ${releaseYear(lockedTitle)} · ${typeLabel(lockedTitle.mediaType)}</span></p>`
    : `<div class="field">
         <label for="rf-title">Title</label>
         <select id="rf-title" aria-describedby="rf-title-error" aria-invalid="false">
           <option value="">Choose a title…</option>
           ${choices.map((t) => `<option value="${t.id}">${esc(t.title)} (${releaseYear(t)})</option>`).join('')}
         </select>
         <p class="field-error" id="rf-title-error" hidden></p>
       </div>`;

  const stars = [5, 4, 3, 2, 1].map((n) => `
      <input type="radio" name="rating" id="rf-rating-${n}" value="${n}" ${existing?.rating === n ? 'checked' : ''}>
      <label for="rf-rating-${n}" title="${n} out of 5"><span aria-hidden="true">★</span><span class="visually-hidden">${n} out of 5 stars</span></label>`).join('');

  openModal({
    title: existing ? 'Edit review' : 'Write a review',
    size: 'md',
    bodyHtml: `
      <form id="review-form" novalidate>
        ${titleField}
        <fieldset class="field" aria-describedby="rf-rating-error">
          <legend>Your rating</legend>
          <div class="star-input">${stars}</div>
          <p class="field-error" id="rf-rating-error" hidden></p>
        </fieldset>
        <div class="field">
          <label for="rf-text">Your review</label>
          <textarea id="rf-text" rows="5" maxlength="${MAX_TEXT}" aria-describedby="rf-text-error rf-text-count" aria-invalid="false">${esc(existing?.text ?? '')}</textarea>
          <p class="field-hint" id="rf-text-count"></p>
          <p class="field-error" id="rf-text-error" hidden></p>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" data-modal-cancel>Cancel</button>
          <button type="submit" class="btn btn-primary">${existing ? 'Save changes' : 'Save review'}</button>
        </div>
      </form>`,
    onMount: (dialog, close) => {
      const form = dialog.querySelector('#review-form');
      const text = form.querySelector('#rf-text');
      const count = form.querySelector('#rf-text-count');
      const ratingError = form.querySelector('#rf-rating-error');
      const titleSelect = form.querySelector('#rf-title');
      if (titleSelect && lockedTitle) titleSelect.value = String(lockedTitle.id);

      const updateCount = () => { count.textContent = `${text.value.length} / ${MAX_TEXT} characters (minimum ${MIN_TEXT})`; };
      updateCount();
      text.addEventListener('input', updateCount);
      dialog.querySelector('[data-modal-cancel]').addEventListener('click', () => close());

      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const rating = Number(form.querySelector('input[name="rating"]:checked')?.value ?? 0);
        const body = text.value.trim();
        let valid = true;

        if (titleSelect) valid = setFieldError(titleSelect, titleSelect.value ? '' : 'Please choose a title.') && valid;
        ratingError.hidden = rating !== 0;
        ratingError.textContent = rating ? '' : 'Please choose a rating from 1 to 5 stars.';
        if (!rating) valid = false;
        if (!body) valid = setFieldError(text, 'Please write a few words about this title.') && valid;
        else if (body.length < MIN_TEXT) valid = setFieldError(text, `Your review needs at least ${MIN_TEXT} characters.`) && valid;
        else setFieldError(text, '');

        if (!valid) { form.querySelector('[aria-invalid="true"], input[name="rating"]')?.focus(); return; }

        const targetTitleId = lockedTitle ? lockedTitle.id : Number(titleSelect.value);
        const saved = saveReview({ id: existing?.id, titleId: targetTitleId, rating, text: body });
        if (!saved) { showToast('You already reviewed this title. Edit your existing review instead.', 'error'); return; }
        demoToast(existing ? 'Review updated' : 'Review added');
        close();
        onSaved(saved);
      });
    },
  });
}
