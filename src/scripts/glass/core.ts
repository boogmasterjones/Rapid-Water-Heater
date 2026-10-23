// Glass Rain behaviour shared by every page: scroll reveals, pausing loops that are off screen, and 3D tilt with glare.
// Everything here is progressive: without this script the page is complete and still.
import { $, $$, FINE, RM, SHOT } from './env';

const root = document.documentElement;
root.classList.toggle('no-fine', !FINE);

// ---------- Scroll reveal ----------
// Elements marked data-reveal (components) plus the common blocks of the ported content markup fade and rise once.
// Content blocks are only hidden if they start below the first screen, so nothing visible ever blinks.
const AUTO = [
  '.section-head', '.card', '.testi-card', '.faq-list', '.content-block', '.family-feature', '.family-card', '.family-duo',
  '.family-gallery', '.photo-band-grid figure', '.cta-band', '.quote-layout > *', '.split > *', '.trust-item', '.area-card',
  '.value-item', '.rating-badge',
].map((s) => `main ${s}`).join(',');

(function reveal() {
  const marked = $$('[data-reveal]');
  if (RM || SHOT || !('IntersectionObserver' in window)) { marked.forEach((e) => e.classList.add('in')); return; }
  const fold = innerHeight;
  const auto = $$(AUTO).filter((el) => !el.closest('.page-hero, .hero, [data-reveal], .rv') && el.getBoundingClientRect().top > fold);
  auto.forEach((el) => {
    el.classList.add('rv');
    const sibs = el.parentElement ? [...el.parentElement.children].filter((c) => c.classList.contains('rv')) : [];
    const i = sibs.indexOf(el);
    if (i > 0) el.dataset.delay = String(Math.min(i, 4) * 80);
  });
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    const el = e.target as HTMLElement;
    io.unobserve(el);
    setTimeout(() => {
      el.classList.add('in');
      // Hand the element back to its own transitions (tilt, hover) once it has arrived.
      if (el.classList.contains('rv')) setTimeout(() => el.classList.remove('rv', 'in'), 900);
    }, Number(el.dataset.delay || 0));
  }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  [...marked, ...auto].forEach((el) => io.observe(el));
})();

// ---------- Loops sleep while their section is off screen ----------
if ('IntersectionObserver' in window && !RM) {
  const io = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle('off', !e.isIntersecting)), { rootMargin: '120px 0px' });
  $$('[data-live], main > section, main > div, .site-footer').forEach((el) => io.observe(el));
}

// ---------- 3D tilt with a glare that follows the pointer (mouse only) ----------
export function tilt(el: HTMLElement, max = 8, host: HTMLElement = el) {
  if (!FINE || RM) return;
  el.classList.add('tilt');
  let glare = $('.glare', el);
  if (!glare) { glare = document.createElement('div'); glare.className = 'glare'; glare.setAttribute('aria-hidden', 'true'); el.appendChild(glare); }
  const g = glare;
  let raf = 0, px = 0.5, py = 0.5;
  const paint = () => {
    raf = 0;
    el.style.transform = `perspective(1200px) rotateY(${((px - 0.5) * max * 2).toFixed(2)}deg) rotateX(${((0.5 - py) * max * 2).toFixed(2)}deg)`;
    g.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`);
    g.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`);
  };
  host.addEventListener('pointermove', (e) => {
    const r = host.getBoundingClientRect();
    px = (e.clientX - r.left) / r.width; py = (e.clientY - r.top) / r.height;
    if (!raf) raf = requestAnimationFrame(paint);
  });
  host.addEventListener('pointerleave', () => { cancelAnimationFrame(raf); raf = 0; el.style.transform = ''; });
}
$$('main .service-card, [data-tilt]').forEach((c) => tilt(c, 8));

// ---------- Keyboard access for the ported review carousel (a scrollable strip must be focusable) ----------
$$('.review-track').forEach((t) => { if (!t.hasAttribute('tabindex')) { t.tabIndex = 0; t.setAttribute('role', 'region'); t.setAttribute('aria-label', 'Customer reviews'); } });
