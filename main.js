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

// Original, quiet piano-style accompaniment synthesized locally with Web Audio.
// Autoplay when permitted; otherwise start on the first guest interaction.
(() => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  const control = document.querySelector('.music-control');
  const toggle = document.querySelector('#music-toggle');
  const label = document.querySelector('#music-label');
  const message = document.querySelector('#music-status');
  if (!control || !toggle) return;
  control.hidden = false;
  let context;
  let master;
  let timer;
  let playing = false;
  let requested = false;
  let automaticStart = true;
  let nextNote = 0;
  let step = 0;
  // Four gentle chords, each expressed as a slow, repeating arpeggio.
  const chords = [[48, 55, 60, 64], [45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 59]];
  const pattern = [0, 1, 2, 3, 2, 1, 3, 2];
  function note(midi, start) {
    const frequency = 440 * Math.pow(2, (midi - 69) / 12);
    const envelope = context.createGain();
    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(0.18, start + 0.018);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + 2.7);
    envelope.connect(master);
    // A mellow fundamental and a very soft overtone approximate a piano attack.
    [1, 2].forEach((harmonic, index) => {
      const oscillator = context.createOscillator();
      const level = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency * harmonic;
      level.gain.value = index === 0 ? 1 : 0.12;
      oscillator.connect(level);
      level.connect(envelope);
      oscillator.start(start);
      oscillator.stop(start + 2.8);
      oscillator.onended = () => { oscillator.disconnect(); level.disconnect(); };
    });
  }
  function schedule() {
    while (nextNote < context.currentTime + 0.2) {
      const chord = chords[Math.floor(step / pattern.length) % chords.length];
      note(chord[pattern[step % pattern.length]] + 12, nextNote);
      nextNote += 0.72;
      step += 1;
    }
  }
  function render() {
    toggle.setAttribute('aria-pressed', String(playing));
    toggle.setAttribute('aria-label', playing ? 'Pause soft background music' : 'Play soft background music');
    label.textContent = playing ? 'Pause music' : 'Play music';
  }
  async function pause() {
    clearInterval(timer);
    timer = undefined;
    playing = false;
    render();
    if (context && context.state === 'running') await context.suspend();
  }
  function removeAutomaticListeners() {
    automaticStart = false;
    document.removeEventListener('click', firstInteraction);
    document.removeEventListener('touchend', firstInteraction);
    document.removeEventListener('keydown', firstInteraction);
  }
  function activate() {
    if (!requested || document.hidden || context.state !== 'running' || playing) return;
    nextNote = Math.max(nextNote, context.currentTime + 0.05);
    playing = true;
    message.textContent = '';
    render();
    schedule();
    timer = window.setInterval(schedule, 100);
    removeAutomaticListeners();
  }
  function start() {
    if (document.hidden) return;
    requested = true;
    message.textContent = '';
    try {
      if (!context) {
        context = new AudioContextClass();
        master = context.createGain();
        master.gain.value = 0.5;
        master.connect(context.destination);
        nextNote = context.currentTime + 0.05;
        context.addEventListener('statechange', () => {
          if (context.state === 'running') {
            activate();
          } else {
            clearInterval(timer);
            playing = false;
            render();
            if (requested && !document.hidden) message.textContent = 'Tap Play music to hear the piano.';
          }
        });
      }
      if (context.state !== 'running') message.textContent = 'Tap Play music to hear the piano.';
      // A blocked resume may stay pending until a gesture. Keep controls responsive.
      context.resume().then(activate).catch(() => {
        if (requested) message.textContent = 'Tap Play music to start the music.';
      });
      activate();
    } catch {
      requested = false;
      message.textContent = 'Music could not start. Please try again.';
    }
  }
  function firstInteraction(event) {
    if (!automaticStart || event.target.closest?.('.music-control')) return;
    if (event.type === 'keydown' && (event.ctrlKey || event.metaKey || event.altKey || ['Shift', 'Control', 'Alt', 'Meta', 'Escape'].includes(event.key))) return;
    start();
  }
  toggle.addEventListener('click', () => {
    removeAutomaticListeners();
    if (playing) {
      requested = false;
      pause().catch(() => {});
    } else {
      start();
    }
  });
  document.addEventListener('click', firstInteraction);
  document.addEventListener('touchend', firstInteraction, { passive: true });
  document.addEventListener('keydown', firstInteraction);
  // Pause when hidden. Coming back never overrides a guest's pause choice.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      requested = false;
      pause().catch(() => {});
    }
  });
  start();
})();
