// Progressive enhancement only: without this script the page is fully readable and static.

// Countdown to the application deadline.
const countdown = document.querySelector('.countdown');
if (countdown) {
  const deadline = new Date(countdown.dataset.deadline).getTime();
  const cells = {};
  countdown.querySelectorAll('[data-unit]').forEach(el => { cells[el.dataset.unit] = el; });
  const pad = n => String(n).padStart(2, '0');
  const tick = () => {
    const left = Math.max(0, deadline - Date.now());
    const s = Math.floor(left / 1000);
    cells.d.textContent = pad(Math.floor(s / 86400));
    cells.h.textContent = pad(Math.floor(s / 3600) % 24);
    cells.m.textContent = pad(Math.floor(s / 60) % 60);
    cells.s.textContent = pad(s % 60);
    if (left === 0) {
      countdown.classList.add('is-over');
      document.querySelector('.until').textContent = 'Applications are now closed.';
      clearInterval(timer);
    }
  };
  tick();
  const timer = setInterval(tick, 1000);
}

// Welcome popup: once per browser session, after the page has had a moment to load.
const welcome = document.querySelector('.welcome');
if (welcome && typeof welcome.showModal === 'function') {
  let seen = false;
  try { seen = sessionStorage.getItem('welcomeSeen') === '1'; } catch (e) {}
  const close = () => {
    welcome.close();
    try { sessionStorage.setItem('welcomeSeen', '1'); } catch (e) {}
  };
  welcome.querySelector('.welcome-close').addEventListener('click', close);
  welcome.querySelector('.welcome-later').addEventListener('click', close);
  welcome.querySelector('a.btn').addEventListener('click', close);
  welcome.addEventListener('click', e => { if (e.target === welcome) close(); });
  welcome.addEventListener('cancel', () => { try { sessionStorage.setItem('welcomeSeen', '1'); } catch (e) {} });
  if (!seen) setTimeout(() => welcome.showModal(), 1200);
}

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Timeline road: a winding road drawn through one checkpoint per date. As you scroll, the driven
// stretch is painted, a car follows it, and each checkered flag lights up when the car reaches it.
// Scroll-linked (user-driven), so it stays on under reduced motion.
const wrap = document.querySelector('.timeline-wrap');
const timeline = wrap.querySelector('.timeline');
const steps = [...timeline.children];
const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
svg.setAttribute('class', 'road');
svg.setAttribute('aria-hidden', 'true');
wrap.prepend(svg);

let road = null;
let ticking = false;

// offsetTop ignores the reveal transforms, unlike getBoundingClientRect
const topWithin = el => {
  let y = 0;
  for (; el && el !== timeline; el = el.offsetParent) y += el.offsetTop;
  return y;
};

function buildRoad() {
  const w = svg.getBoundingClientRect().width;
  if (!w) return;
  const small = w < 120;
  const roadW = small ? 18 : 40;
  const amp = small ? 16 : 38;
  const [clothW, clothH, pole] = small ? [14, 10, 22] : [24, 16, 34];

  // checkpoints alternate left and right of the column's centre, level with each date
  const pts = steps.map((li, i) => {
    const date = li.querySelector('.date');
    return { x: w / 2 + (i % 2 ? amp : -amp), y: topWithin(date) + date.offsetHeight / 2, side: i % 2 ? 1 : -1 };
  });

  // enter straight down into the first checkpoint
  let prev = { x: pts[0].x, y: 0 };
  let d = `M${prev.x},0`;
  pts.forEach(p => {
    const mid = (prev.y + p.y) / 2;
    d += ` C${prev.x},${mid} ${p.x},${mid} ${p.x},${p.y}`;
    prev = p;
  });
  const endY = prev.y + (small ? 26 : 38);
  d += ` L${prev.x},${endY}`;

  const flags = pts.map(p => {
    const px = p.x + p.side * (roadW / 2 + 3);
    const clothX = p.side > 0 ? px : px - clothW;
    return `<g class="flag"><line x1="${px}" y1="${p.y + 2}" x2="${px}" y2="${p.y - pole}"/>` +
      `<rect x="${clothX}" y="${p.y - pole}" width="${clothW}" height="${clothH}" fill="url(#checker)"/></g>`;
  }).join('');

  svg.innerHTML =
    `<defs><pattern id="checker" width="8" height="8" patternUnits="userSpaceOnUse">` +
    `<rect width="8" height="8" fill="#fff"/><rect width="4" height="4" fill="#14110f"/>` +
    `<rect x="4" y="4" width="4" height="4" fill="#14110f"/></pattern></defs>` +
    `<path class="road-base" d="${d}" stroke-width="${roadW}"/>` +
    `<path class="road-driven" d="${d}" stroke-width="${roadW}"/>` +
    `<path class="road-dash" d="${d}" stroke-width="2"/>` +
    `<rect x="${prev.x - roadW / 2}" y="${prev.y - 5}" width="${roadW}" height="10" fill="url(#checker)"/>` +
    flags +
    `<g class="car"><g transform="scale(${small ? 0.8 : 1.25})"><rect class="car-body" x="-7" y="-12" width="14" height="24" rx="5"/>` +
    `<rect class="car-stripe" x="-2" y="-11" width="4" height="22"/><rect class="car-glass" x="-5" y="-2" width="10" height="6" rx="2"/></g></g>`;

  const path = svg.querySelector('.road-driven');
  const len = path.getTotalLength();
  path.style.strokeDasharray = len;
  road = { path, len, pts, endY, flags: [...svg.querySelectorAll('.flag')], car: svg.querySelector('.car') };
  updateRoad();
}

function updateRoad() {
  ticking = false;
  if (!road) return;
  const { path, len, pts, endY, flags, car } = road;
  const target = Math.min(endY, Math.max(0, innerHeight * 0.6 - timeline.getBoundingClientRect().top));

  // the path only ever heads downward, so its length at a given y can be found by bisection
  let lo = 0, hi = len;
  for (let k = 0; k < 18; k++) {
    const mid = (lo + hi) / 2;
    if (path.getPointAtLength(mid).y < target) lo = mid; else hi = mid;
  }
  const at = path.getPointAtLength(lo);
  const a = path.getPointAtLength(Math.max(0, lo - 1));
  const b = path.getPointAtLength(Math.min(len, lo + 1));
  const angle = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI - 90;
  car.setAttribute('transform', `translate(${at.x},${at.y}) rotate(${angle})`);
  path.style.strokeDashoffset = len - lo;
  flags.forEach((flag, i) => flag.classList.toggle('is-active', pts[i].y <= target));
}

function onScroll() {
  if (!ticking) { ticking = true; requestAnimationFrame(updateRoad); }
}

addEventListener('scroll', onScroll, { passive: true });
// rebuilds on viewport changes and when the web fonts land, since both move the checkpoints
new ResizeObserver(buildRoad).observe(timeline);
buildRoad();

if (!reduceMotion) {
  // Fade-up reveals. Grid siblings are staggered; everything else reveals on its own.
  const staggered = '.stats div, .pillars article, .prizes div, .apply .checks li';
  const targets = document.querySelectorAll(
    `main .eyebrow, main h2, .note, .portfolio, .timeline > li, ${staggered}`
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
