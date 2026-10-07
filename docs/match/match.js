// Shared link: /match/#<event secret>. Visitors pick their name, which opens /match/#<event secret>/<id>.
// The roster is stored encrypted (roster.enc) with a key derived from the event secret, which exists only
// in the shared link, so names are not readable from the public site. Nothing proves who is submitting;
// each browser sends a random device id so tools/match.py can flag a name submitted from several devices.

const main = document.querySelector('.match');
const title = document.querySelector('.match-title');
const lede = document.querySelector('.match-lede');
const as = document.querySelector('.match-as');
const who = document.querySelector('.match-who');
const whoSearch = document.querySelector('#who-search');
const whoList = document.querySelector('#who-list');
const grid = document.querySelector('.match-grid');
const picksEl = document.querySelector('.picks');
const peopleEl = document.querySelector('.match-grid .people');
const search = document.querySelector('#search');
const submit = document.querySelector('#submit');
const msg = document.querySelector('.match-msg');

const fromB64 = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));

function stop(heading, text) {
  title.textContent = heading;
  lede.textContent = text;
  as.textContent = '';
  who.hidden = true;
  grid.hidden = true;
}

async function loadRoster(secret) {
  const res = await fetch('roster.enc', { cache: 'no-store' });
  if (!res.ok) return null;
  const blob = fromB64((await res.text()).trim());
  const raw = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
  const key = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['decrypt']);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: blob.slice(0, 12) }, key, blob.slice(12));
  return JSON.parse(new TextDecoder().decode(plain));
}

let device;
try {
  device = localStorage.getItem('matchDevice') || crypto.randomUUID().slice(0, 8);
  localStorage.setItem('matchDevice', device);
} catch (e) { device = device || crypto.randomUUID().slice(0, 8); }

const personRow = (text, label, onClick) => {
  const li = document.createElement('li');
  const row = Object.assign(document.createElement('button'), { type: 'button', className: 'person' });
  row.append(Object.assign(document.createElement('span'), { className: 'name', textContent: text }),
    Object.assign(document.createElement('span'), { className: 'add', textContent: label }));
  row.addEventListener('click', onClick);
  li.append(row);
  return li;
};

let roster, secret;

async function start() {
  // tolerate whitespace picked up when a link is copied (it arrives percent-encoded, e.g. %0D or %20)
  const [s, idText] = decodeURIComponent(location.hash.slice(1)).trim().split('/');
  if (!s) return stop('Use the matching link', 'This page opens from the link shared by the Draper Fellowship team.');
  if (s !== secret) {
    secret = s;
    try { roster = await loadRoster(secret); } catch (e) { roster = undefined; }
  }
  if (roster === null) return stop('Matching is not open yet', 'Check back after the speed-dating session.');
  if (!roster) return stop('This link is not valid', 'Please open the link exactly as it was shared.');

  const self = idText === undefined ? null : roster.people.find(p => String(p.id) === idText);
  if (!self) return choose();
  rank(self);
}

function choose() {
  const listed = roster.people.filter(p => !p.hidden).sort((a, b) => a.name.localeCompare(b.name));
  title.textContent = 'Who are you?';
  lede.textContent = 'Find your name to rank the people you want to build with.';
  as.textContent = '';
  grid.hidden = true;
  who.hidden = false;
  const render = () => {
    const q = whoSearch.value.trim().toLowerCase();
    whoList.replaceChildren(...listed.filter(p => p.name.toLowerCase().includes(q))
      .map(p => personRow(p.name, 'This is me', () => { location.hash = `${secret}/${p.id}`; })));
  };
  whoSearch.oninput = render;
  render();
  whoSearch.focus();
}

function rank(self) {
  const me = self.id;
  const others = roster.people.filter(p => p.id !== me && !p.hidden).sort((a, b) => a.name.localeCompare(b.name));
  const min = Math.min(roster.min, others.length);
  const byId = new Map(others.map(p => [p.id, p]));
  const storeKey = 'matchPicks:' + me;
  let picks = [];
  try { picks = (JSON.parse(localStorage.getItem(storeKey)) || []).filter(id => byId.has(id)); } catch (e) {}

  title.textContent = 'Who do you want to build with?';
  lede.textContent = `Rank at least ${min} people, best fit first. We recommend ranking everyone you would consider building with. You can change your ranking and submit again; only your latest submission counts.`;
  as.replaceChildren(`Submitting as ${self.name}. `,
    Object.assign(document.createElement('a'), { href: `#${secret}`, textContent: 'Not you?' }));
  who.hidden = true;
  grid.hidden = false;
  search.value = '';

  const button = (label, text, onClick, disabled) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'ctl'; b.textContent = text; b.setAttribute('aria-label', label); b.disabled = !!disabled;
    b.addEventListener('click', onClick);
    return b;
  };
  const move = (i, d) => { [picks[i], picks[i + d]] = [picks[i + d], picks[i]]; render(); };

  function render() {
    picksEl.replaceChildren(...picks.map((id, i) => {
      const li = document.createElement('li');
      const rank = Object.assign(document.createElement('span'), { className: 'rank', textContent: i + 1 });
      const name = Object.assign(document.createElement('span'), { className: 'name', textContent: byId.get(id).name });
      li.append(rank, name,
        button(`Move ${byId.get(id).name} up`, '↑', () => move(i, -1), i === 0),
        button(`Move ${byId.get(id).name} down`, '↓', () => move(i, 1), i === picks.length - 1),
        button(`Remove ${byId.get(id).name}`, '×', () => { picks.splice(i, 1); render(); }));
      return li;
    }));
    // empty numbered slots up to the minimum, so the target is visible before anything is picked
    for (let i = picks.length; i < min; i++) {
      const li = Object.assign(document.createElement('li'), { className: 'slot' });
      li.append(Object.assign(document.createElement('span'), { className: 'rank', textContent: i + 1 }),
        Object.assign(document.createElement('span'), { className: 'name', textContent: '' }));
      picksEl.append(li);
    }
    const q = search.value.trim().toLowerCase();
    peopleEl.replaceChildren(...others.filter(p => !picks.includes(p.id) && p.name.toLowerCase().includes(q))
      .map(p => personRow(p.name, 'Add', () => { picks.push(p.id); render(); })));
    submit.disabled = picks.length < min;
    msg.textContent = picks.length < min ? `Add ${min - picks.length} more to submit.` : '';
    msg.classList.remove('is-error', 'is-saved');
  }

  search.oninput = render;

  submit.onclick = async () => {
    submit.disabled = true;
    const body = new URLSearchParams({
      [`entry.${main.dataset.nameEntry}`]: self.name,
      [`entry.${main.dataset.rankingEntry}`]: picks.map((id, i) => `${i + 1}. ${byId.get(id).name}`).join('\n'),
      [`entry.${main.dataset.deviceEntry}`]: device,
    });
    try {
      // no-cors: the response is opaque, so a completed request is treated as saved
      await fetch(`https://docs.google.com/forms/d/e/${main.dataset.form}/formResponse`, { method: 'POST', mode: 'no-cors', body });
      try { localStorage.setItem(storeKey, JSON.stringify(picks)); } catch (e) {}
      msg.textContent = `Saved. ${picks.length} people ranked.`;
      msg.classList.add('is-saved');
    } catch (e) {
      msg.textContent = 'Could not save. Check your connection and try again.';
      msg.classList.add('is-error');
    }
    submit.disabled = false;
  };

  render();
}

window.addEventListener('hashchange', () => { window.scrollTo(0, 0); start(); });
start();
