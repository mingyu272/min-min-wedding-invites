'use strict';
document.documentElement.classList.add('js');
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  navigation.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
}
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('is-open', open);
});
navigation.addEventListener('click', event => {
  if (event.target.closest('a')) closeMenu();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuButton.focus();
  }
});

// Each gallery button owns its thumbnail, full-size URL and caption.
const photos = [...document.querySelectorAll('.gallery-item')];
const lightbox = document.querySelector('#lightbox');
const lightboxImage = document.querySelector('#lightbox-image');
const caption = document.querySelector('#lightbox-caption');
let photoIndex = 0;
function showPhoto(index) {
  photoIndex = (index + photos.length) % photos.length;
  const photo = photos[photoIndex];
  lightboxImage.src = photo.dataset.full;
  lightboxImage.alt = photo.querySelector('img').alt;
  caption.textContent = `${photoIndex + 1} / ${photos.length} · ${photo.dataset.caption}`;
}
photos.forEach((photo, index) => photo.addEventListener('click', () => {
  showPhoto(index);
  lightbox.showModal();
  document.body.classList.add('modal-open');
}));
document.querySelector('#lightbox-close').addEventListener('click', () => lightbox.close());
document.querySelector('#lightbox-prev').addEventListener('click', () => showPhoto(photoIndex - 1));
document.querySelector('#lightbox-next').addEventListener('click', () => showPhoto(photoIndex + 1));
lightbox.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    showPhoto(photoIndex + (event.key === 'ArrowLeft' ? -1 : 1));
  }
});
lightbox.addEventListener('click', event => {
  if (event.target === lightbox) {
    const box = lightbox.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) lightbox.close();
  }
});
lightbox.addEventListener('close', () => {
  document.body.classList.remove('modal-open');
  photos[photoIndex].focus();
});

const form = document.querySelector('#rsvp-form');
const status = document.querySelector('#form-status');
const attendanceFields = document.querySelector('#attendance-fields');
function updateAttendance() {
  const declined = form.elements.attending.value === 'no';
  attendanceFields.hidden = declined;
  attendanceFields.querySelectorAll('input, select').forEach(field => { field.disabled = declined; });
}
form.addEventListener('change', updateAttendance);
form.addEventListener('input', () => {
  status.textContent = '';
  form.elements.fullName.setCustomValidity('');
});
// Integration boundary: replace this function with an awaited backend request.
// Do not display a delivery confirmation until the backend confirms success.
async function submitRsvp(payload) {
  return { sent: false, preview: true };
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  const fullName = form.elements.fullName;
  fullName.setCustomValidity(fullName.value.trim() ? '' : 'Please enter your full name.');
  if (!form.reportValidity()) return;
  const values = new FormData(form);
  const attending = values.get('attending') === 'yes';
  const payload = {
    fullName: values.get('fullName').trim(),
    email: values.get('email').trim(),
    attending,
    guests: attending ? Number(values.get('guests')) : 0,
    meal: attending ? values.get('meal') : null,
    dietary: values.get('dietary').trim(),
    message: values.get('message').trim()
  };
  const button = form.querySelector('[type=submit]');
  button.disabled = true;
  try {
    const result = await submitRsvp(payload);
    status.textContent = result.sent
      ? 'Thank you! Your RSVP has been received.'
      : 'Preview complete. Your RSVP has NOT been sent or saved. Please return when our final RSVP form is available.';
  } catch {
    status.textContent = 'Your RSVP could not be sent. Please try again later.';
  } finally {
    button.disabled = false;
  }
});
updateAttendance();
