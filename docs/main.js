// Progressive enhancement only: without this script the page is fully readable and static.

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Timeline rail: fills as you scroll, dots light up as each date is reached.
// Scroll-linked (user-driven), so it stays on under reduced motion.
const timeline = document.querySelector('.timeline');
const steps = [...timeline.children];
let ticking = false;

function updateRail() {
  ticking = false;
  const mark = innerHeight * 0.6;
  const rect = timeline.getBoundingClientRect();
  const progress = Math.min(1, Math.max(0, (mark - rect.top) / rect.height));
  timeline.style.setProperty('--p', progress);
  steps.forEach(li => li.classList.toggle('is-active', li.getBoundingClientRect().top + 48 < mark));
}

function onScroll() {
  if (!ticking) { ticking = true; requestAnimationFrame(updateRail); }
}

addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', onScroll);
updateRail();

if (!reduceMotion) {
  // Fade-up reveals. Grid siblings are staggered; everything else reveals on its own.
  const staggered = '.stats div, .pillars article, .prizes div, .apply .checks li';
  const targets = document.querySelectorAll(
    `main .eyebrow, main h2, .note, .portfolio, .timeline > li, .pending, ${staggered}`
  );

  const revealer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      revealer.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

  targets.forEach(el => {
    if (el.matches(staggered)) {
      el.style.setProperty('--d', `${[...el.parentElement.children].indexOf(el) * 90}ms`);
    }
    el.classList.add('reveal');
    revealer.observe(el);
  });

  // Count-up numbers.
  const format = (el, n) =>
    (el.dataset.prefix || '') + Math.round(n).toLocaleString('en-US') + (el.dataset.suffix || '');

  const counter = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      counter.unobserve(el);
      const end = Number(el.dataset.count);
      const start = performance.now();
      const duration = 1400;
      const tick = now => {
        const t = Math.min(1, (now - start) / duration);
        el.textContent = format(el, end * (1 - Math.pow(1 - t, 3)));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });

  document.querySelectorAll('[data-count]').forEach(el => {
    el.textContent = format(el, 0);
    counter.observe(el);
  });

  // Portfolio marquee: duplicate the list so the loop is seamless.
  const portfolio = document.querySelector('.portfolio');
  const list = portfolio.querySelector('ul');
  const marquee = document.createElement('div');
  marquee.className = 'marquee';
  const track = document.createElement('div');
  track.className = 'track';
  list.replaceWith(marquee);
  const copy = list.cloneNode(true);
  copy.setAttribute('aria-hidden', 'true');
  track.append(list, copy);
  marquee.append(track);
}
