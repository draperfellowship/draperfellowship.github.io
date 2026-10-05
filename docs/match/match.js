// Personal link format: /match/#<event secret>.<personal token>
// The roster is stored encrypted (roster.enc) with a key derived from the event secret, which exists only
// in the emailed links, so names are not readable from the public site. The token identifies the visitor; only its hash is in the roster.

const main = document.querySelector('.match');
const title = document.querySelector('.match-title');
const lede = document.querySelector('.match-lede');
const grid = document.querySelector('.match-grid');
const picksEl = document.querySelector('.picks');
const peopleEl = document.querySelector('.people');
const emptyEl = document.querySelector('.picks-empty');
const search = document.querySelector('#search');
const submit = document.querySelector('#submit');
const msg = document.querySelector('.match-msg');

const fromB64 = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');

function stop(heading, text) {
  title.textContent = heading;
  lede.textContent = text;
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

async function start() {
  // tolerate whitespace picked up when a link is copied (it arrives percent-encoded, e.g. %0D or %20)
  const [secret, token] = decodeURIComponent(location.hash.slice(1)).trim().split('.');
  if (!secret || !token) return stop('Use your personal link', 'This page opens from the link in your email from the Draper Fellowship team.');

  let roster;
  try { roster = await loadRoster(secret); } catch (e) { roster = undefined; }
  if (roster === null) return stop('Matching is not open yet', 'Check back after the speed-dating session.');
  if (!roster) return stop('This link is not valid', 'Please open the link exactly as it appears in your email.');

  const me = roster.who[hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)))];
  const self = roster.people.find(p => p.id === me);
  if (!self) return stop('This link is not valid', 'Please open the link exactly as it appears in your email.');

  const min = Math.min(roster.min, roster.people.length - 1);
  const others = roster.people.filter(p => p.id !== me).sort((a, b) => a.name.localeCompare(b.name));
  const byId = new Map(others.map(p => [p.id, p]));
  const storeKey = 'matchPicks:' + me;
  let picks = [];
  try { picks = (JSON.parse(localStorage.getItem(storeKey)) || []).filter(id => byId.has(id)); } catch (e) {}

  title.textContent = 'Who do you want to build with?';
  lede.textContent = `Rank at least ${min} people, best fit first. We recommend ranking everyone you would consider building with. You can change your ranking and submit again; only your latest submission counts.`;
  document.querySelector('.match-as').textContent = `Submitting as ${self.name}.`;
  grid.hidden = false;
  document.querySelector('.how').hidden = false;

  const button = (label, text, onClick, disabled) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'icon-btn'; b.textContent = text; b.setAttribute('aria-label', label); b.disabled = !!disabled;
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
    emptyEl.hidden = picks.length > 0;
    const q = search.value.trim().toLowerCase();
    peopleEl.replaceChildren(...others.filter(p => !picks.includes(p.id) && p.name.toLowerCase().includes(q)).map(p => {
      const li = document.createElement('li');
      const name = Object.assign(document.createElement('span'), { className: 'name', textContent: p.name });
      li.append(name, button(`Add ${p.name}`, '+', () => { picks.push(p.id); render(); }));
      return li;
    }));
    submit.disabled = picks.length < min;
    msg.textContent = picks.length < min ? `Add ${min - picks.length} more to submit.` : '';
    msg.classList.remove('is-error');
  }

  search.addEventListener('input', render);

  submit.addEventListener('click', async () => {
    submit.disabled = true;
    const body = new URLSearchParams({ [`entry.${main.dataset.entry}`]: JSON.stringify({ t: token, c: picks }) });
    try {
      // no-cors: the response is opaque, so a completed request is treated as saved
      await fetch(`https://docs.google.com/forms/d/e/${main.dataset.form}/formResponse`, { method: 'POST', mode: 'no-cors', body });
      try { localStorage.setItem(storeKey, JSON.stringify(picks)); } catch (e) {}
      msg.textContent = `Saved: ${picks.map((id, i) => `${i + 1}. ${byId.get(id).name}`).join(', ')}.`;
    } catch (e) {
      msg.textContent = 'Could not save. Check your connection and try again.';
      msg.classList.add('is-error');
    }
    submit.disabled = false;
  });

  render();
}

start();
