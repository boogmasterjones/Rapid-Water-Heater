// Phone-only behaviour (760px and narrower; desktop never runs any of it).
// 1. The header pill slides away while the visitor reads down the page and comes back the moment they scroll up. It
//    only hides while the bottom call bar is showing, so a Call button is always on screen.
// 2. Long keyword sections on service, location and hub pages open with "Keep reading" instead of filling five or six
//    screens. The text stays in the page (search engines and screen readers get all of it); blog posts are never clamped.
import { $, $$ } from './env';

const SMALL = matchMedia('(max-width: 760px)');

// ---------- 1. Header that steps aside ----------
(function header() {
  const bar = $('.site-header');
  const nav = $('.main-nav');
  if (!bar) return;
  let lastY = scrollY;
  let raf = 0;
  const update = () => {
    raf = 0;
    const y = scrollY;
    const dy = y - lastY;
    if (!SMALL.matches || y < 120 || nav?.classList.contains('open') || bar.contains(document.activeElement)) {
      bar.classList.remove('hdr-away');
      lastY = y;
      return;
    }
    if (Math.abs(dy) < 8) return;
    const barShowing = document.body.classList.contains('sticky-bar-visible');
    bar.classList.toggle('hdr-away', dy > 0 && barShowing);
    lastY = y;
  };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  SMALL.addEventListener('change', update);
})();

// ---------- 2. "Keep reading" on long keyword sections ----------
(function keepReading() {
  if (!SMALL.matches) return;
  if ($('.page-hero .blog-meta')) return; // a blog post: the article is the point of the page
  const target = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
  const clampH = Math.round(Math.min(560, Math.max(440, innerHeight * 0.62)));
  $$('main .content-block').forEach((block, i) => {
    if (target && block.contains(target)) return;
    if (block.scrollHeight < clampH + 360) return; // not worth folding
    if (!block.id) block.id = `read-${i + 1}`;
    block.style.setProperty('--clamp-h', `${clampH}px`);
    block.classList.add('is-clamped');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-navy read-more';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', block.id);
    btn.innerHTML = 'Keep reading <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
    btn.addEventListener('click', () => {
      btn.setAttribute('aria-expanded', 'true');
      block.style.setProperty('--clamp-h', `${block.scrollHeight}px`);
      block.classList.add('is-opening');
      block.classList.remove('is-clamped');
      block.style.maxHeight = `${clampH}px`;
      requestAnimationFrame(() => { block.style.maxHeight = `${block.scrollHeight}px`; });
      setTimeout(() => { block.style.maxHeight = ''; block.classList.remove('is-opening'); btn.remove(); }, 650);
      // Keyboard and screen-reader users land on the text they asked for.
      const next = block.querySelectorAll('p, h2, h3, ul')[2] as HTMLElement | undefined;
      if (next) { next.tabIndex = -1; next.focus({ preventScroll: true }); }
    });
    block.appendChild(btn);
    // Tabbing into a link inside the folded part opens it, so focus never lands on hidden text.
    block.addEventListener('focusin', (e) => { if (block.classList.contains('is-clamped') && e.target !== btn) btn.click(); });
  });
  // A link to a heading inside a folded section opens it first.
  addEventListener('hashchange', () => {
    const t = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
    const folded = t?.closest('.content-block.is-clamped');
    if (folded) { (folded.querySelector('.read-more') as HTMLButtonElement | null)?.click(); setTimeout(() => t?.scrollIntoView(), 700); }
  });
})();
