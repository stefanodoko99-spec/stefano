// The sheet's controls: the dateline clock (Albania time), the language and
// proof words, the sticky pill, "read" states, and the index that deals out
// as a stack of small sheets.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { state, bus, clamp } from '../state.js';
import { albaniaNow } from '../i18n.js';
import { sunIsUp } from '../sun.js';
import { pathFor, isHere, routeOf } from '../routes.js';
import { judder, sound } from './press.js';
import { has } from './site.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// ---------- clock ----------
export function startClock() {
  const tick = () => {
    const { date, time, seconds } = albaniaNow(state.lang, state.mobile);
    $$('[data-date]').forEach((el) => { el.textContent = date; });
    // with the press stopped the clock keeps the minute: seconds that tick by are motion too
    $$('[data-clock]').forEach((el) => { el.textContent = state.still ? time : `${time}:${seconds}`; el.setAttribute('datetime', time); });
    const line = $('[data-clock-line]');
    if (line) line.textContent = state.T.clockLine(time);
    // the band's line on its sun, up or set as the sun over Albania is now (or
    // turned to a moon in the night edition), and what pressing it does; only
    // where the engraving is drawn, since only it follows the sun
    const drawn = document.documentElement.classList.contains('gl-on');
    const T = state.T;
    const up = sunIsUp();
    const sky = !up ? T.sunNight : state.night ? T.moonDay : T.sunDay;
    const press = state.night ? T.pressMoonDay : up ? T.pressSun : T.pressMoonNight;
    // and, read from MET Norway through the Worker, the weather it shows (src/weather.js)
    const w = state.weather;
    const weather = w ? T.wxLine(T.wx[w.word], w.temp, w.met) : '';
    const sunLine = [sky, weather, press].filter(Boolean).join(' ');
    $$('[data-sun-line]').forEach((el) => {
      if (el.textContent !== sunLine) el.textContent = sunLine;
      if (el.hidden === drawn) el.hidden = !drawn;
    });
  };
  tick();
  setInterval(tick, 1000);
  bus.on('lang', tick);
  bus.on('still', tick);
  bus.on('night', tick);
  bus.on('weather', tick);
}

// ---------- pill, read states, current section ----------
const tracked = ['offer', 'best', 'work', 'elixir', 'martiri', 'greta', 'graphic', 'quotes', 'about', 'services', 'rates', 'contact', 'back'];
// the case sheets and the graphic work belong to the work, the rates to the websites; the letters have no word of their own
const CASES = new Set(['elixir', 'martiri', 'greta', 'graphic']);
const NAV_OF = { offer: 'services', best: 'services', rates: 'services', quotes: null, back: null };

export function initNav() {
  const pill = $('[data-pill]');
  const toolbar = $('[data-toolbar]');
  const readSet = new Set();
  let edition = null;
  bus.on('edition', (el) => { edition = el; });

  // measured once per layout change, never per frame
  let maxScroll = 1;
  const measureHeight = () => { maxScroll = Math.max(1, document.documentElement.scrollHeight - state.vh); };
  measureHeight();
  bus.on('resize', measureHeight);
  bus.on('refit', measureHeight);
  ScrollTrigger.addEventListener('refresh', measureHeight);

  // On the front page the words that lead to its parts' pages (data-spy) mark the
  // part being read, and fade once it has been read. On a part's own page the
  // word of that page is marked as the page (main.js), and nothing is spied.
  const home = routeOf() === 'home';
  const navLinks = () => (home ? $$('.toolbar__nav .word[data-spy], .pill__nav .word[data-spy], .tabbar__item[data-spy]').filter((a) => !a.closest('[data-edition]')) : []);
  let links = navLinks();
  bus.on('edition', () => { links = navLinks(); });
  // an optional part that is switched off is not read, nor current
  const sections = tracked.map((id) => document.getElementById(id)).filter((el) => el && !el.hidden);
  let pillOn = null, lastRead = -1, lastCurrent;

  let tbBottom = 0, edTop = Infinity, current = null;
  const newlyRead = [];
  function measure() {
    tbBottom = toolbar.getBoundingClientRect().bottom;
    edTop = edition ? edition.getBoundingClientRect().top : Infinity;
    current = null;
    newlyRead.length = 0;
    const mid = state.vh * 0.45, readLine = state.vh * 0.25;
    for (const el of sections) {
      const r = el.getBoundingClientRect();
      if (r.top < mid && r.bottom > mid) current = el.id;
      if (r.bottom < readLine && !readSet.has(el.id)) newlyRead.push(el.id);
    }
  }
  function apply() {
    // writes, and only when something changed
    const show = tbBottom < -40 && edTop >= 120 && !state.menuOpen;
    if (show !== pillOn) { pillOn = show; pill.classList.toggle('is-on', show); }
    const read = clamp(state.scroll / maxScroll);
    if (Math.abs(read - lastRead) > 0.002) { lastRead = read; pill.style.setProperty('--read', read.toFixed(3)); }
    for (const id of newlyRead) {
      readSet.add(id);
      if (home) $$(`a[href="#${id}"], a[data-spy="#${id}"]`).filter((a) => !a.closest('[data-edition]')).forEach((a) => a.classList.add('is-read'));
    }
    const navId = CASES.has(current) ? 'work' : current in NAV_OF ? NAV_OF[current] : current;
    if (navId !== lastCurrent) {
      lastCurrent = navId;
      for (const a of links) {
        if (a.dataset.spy === `#${navId}`) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      }
    }
  }
  return { measure, apply };
}

// ---------- the index: a stack of small sheets ----------
export function initMenu(scrollTo) {
  const menu = $('[data-menu]');
  const list = $('[data-menu-list]', menu);
  const openers = $$('[data-menu-open]');
  const closer = $('[data-menu-close]', menu);
  let trigger = null;

  // each sheet of the index names a sheet of the site, or a part of the front
  // page; an optional part (a fifth entry names it) only while it is switched on
  const render = () => {
    list.replaceChildren(...state.T.menu.filter((entry) => !entry[4] || has(entry[4])).map(([route, hash, title, line], i) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.className = 'stack-menu__sheet';
      a.dataset.route = route;
      if (hash) a.dataset.hash = hash;
      a.href = pathFor(route, state.lang) + hash;
      a.style.zIndex = String(20 - i);
      a.innerHTML = `<b></b><i></i><svg class="hand" aria-hidden="true"><use href="#hand"/></svg>`;
      a.querySelector('b').textContent = title;
      a.querySelector('i').textContent = line;
      li.appendChild(a);
      return li;
    }));
    closer.textContent = state.T.navClose;
  };
  render();

  // The search: the words typed are looked for in every sheet of this
  // language (all of them, accents aside), and the sheets that hold them take
  // the index's place, each with the line where the first word stands. An
  // empty field gives the index back; Enter opens the first sheet found.
  const field = $('[data-menu-search] input', menu);
  const found = {};
  const fold = (s) => [...s].map((c) => c.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().charAt(0) || c).join('');
  const sheetsOf = (lang) => {
    found[lang] ||= fetch(`/search/${lang}.json`).then((r) => (r.ok ? r.json() : [])).catch(() => [])
      .then((list) => list.map((e) => ({ ...e, f: fold(e.x), ft: fold(e.t) })));
    return found[lang];
  };
  const around = (e, w) => {
    const i = e.f.indexOf(w);
    if (i < 0) return `${e.x.slice(0, 90).trim()}…`;
    const a = Math.max(0, e.x.lastIndexOf(' ', Math.max(0, i - 36)));
    return `${a > 0 ? '…' : ''}${e.x.slice(a, i + 64).trim()}…`;
  };
  let asked = '';
  async function search() {
    const q = field.value.trim();
    asked = q;
    const words = fold(q).split(/\s+/).filter((w) => w.length > 1);
    if (!words.length) { render(); return; }
    const lang = state.lang;
    const all = await sheetsOf(lang);
    if (asked !== q) return; // a later keystroke has asked again
    // a sheet named by the words comes first; then the one where they stand
    // thickest (per thousand letters: the front page holds every part, so a
    // plain count would always put it first)
    const hits = all
      .filter((e) => words.every((w) => e.f.includes(w) || e.ft.includes(w)))
      .map((e) => ({ e, score: words.reduce((s, w) => s + (e.ft.includes(w) ? 20 : 0) + ((e.f.split(w).length - 1) * 1000) / Math.max(1000, e.f.length), 0) }))
      .sort((a, b) => b.score - a.score).slice(0, 6);
    if (!hits.length) {
      const li = document.createElement('li');
      li.className = 'stack-menu__none';
      li.textContent = state.T.searchNone(q);
      list.replaceChildren(li);
      return;
    }
    list.replaceChildren(...hits.map(({ e }, i) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.className = 'stack-menu__sheet';
      a.dataset.route = e.r;
      a.href = pathFor(e.r, lang);
      a.style.zIndex = String(20 - i);
      a.innerHTML = `<b></b><i></i><svg class="hand" aria-hidden="true"><use href="#hand"/></svg>`;
      a.querySelector('b').textContent = e.t;
      a.querySelector('i').textContent = around(e, words[0]);
      li.appendChild(a);
      return li;
    }));
  }
  let typing = null;
  field?.addEventListener('input', () => { clearTimeout(typing); typing = setTimeout(search, 120); });
  field?.form.addEventListener('submit', (e) => { e.preventDefault(); list.querySelector('a')?.click(); });
  bus.on('lang', () => { if (field?.value.trim()) search(); else render(); });

  const sheets = () => $$('.stack-menu__sheet', menu);
  function open(btn) {
    if (state.menuOpen) return;
    trigger = btn;
    state.menuOpen = true;
    menu.hidden = false;
    openers.forEach((b) => b.setAttribute('aria-expanded', 'true'));
    const from = state.mobile ? 40 : -40;
    const s = sheets();
    if (state.reduced) gsap.set(s, { opacity: 1, y: 0, rotation: (i) => (i % 2 ? 1.1 : -1.1) });
    else gsap.fromTo(s, { opacity: 0, y: from, rotation: (i) => (i % 2 ? 7 : -7) }, { opacity: 1, y: 0, rotation: (i) => (i % 2 ? 1.1 : -1.1), duration: 0.34, ease: 'power3.out', stagger: state.mobile ? { each: 0.035, from: 'end' } : 0.035 });
    sound.paper();
    s[0]?.focus();
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onOutside, true);
  }
  // how far the stack has been pulled down by a finger (phones)
  const pull = { y: 0 };
  const paintPull = () => { menu.style.translate = pull.y ? `0 ${pull.y.toFixed(1)}px` : ''; };
  function close(returnFocus = true, flung = false) {
    if (!state.menuOpen) return;
    state.menuOpen = false;
    openers.forEach((b) => b.setAttribute('aria-expanded', 'false'));
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('pointerdown', onOutside, true);
    const done = () => {
      menu.hidden = true;
      pull.y = 0; paintPull(); menu.style.opacity = '';
      // the index opens as the index next time
      if (field?.value) { field.value = ''; asked = ''; render(); }
      if (returnFocus) trigger?.focus();
    };
    if (state.reduced) done();
    // pulled away: the stack carries on down the way the finger sent it
    else if (flung) gsap.to(pull, { y: Math.max(pull.y + 160, menu.offsetHeight * 0.8), duration: 0.24, ease: 'power2.out', onUpdate: () => { paintPull(); menu.style.opacity = String(1 - Math.min(1, pull.y / (menu.offsetHeight * 0.9))); }, onComplete: done });
    else gsap.to(sheets(), { opacity: 0, y: state.mobile ? 24 : -24, duration: 0.18, ease: 'power2.in', stagger: 0.015, onComplete: done });
  }
  // phones: the index is a stack at the foot of the screen; pull it down to put it away
  if (state.mobile) {
    let drag = null;
    let swallowClick = false;
    menu.addEventListener('pointerdown', (e) => {
      // a new touch is a new choice (a finger's pull is followed by no click to swallow)
      swallowClick = false;
      if (drag || !state.menuOpen || e.button > 0 || e.target.closest('[data-menu-close]')) return;
      gsap.killTweensOf(pull);
      drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY - pull.y, on: false, trail: [[e.timeStamp, e.clientY]] };
    });
    menu.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dy = e.clientY - drag.y0;
      if (!drag.on) {
        if (Math.abs(dy) < 8 || Math.abs(dy) < Math.abs(e.clientX - drag.x0)) return;
        drag.on = true;
        menu.setPointerCapture(e.pointerId);
      }
      // down follows the finger; up gives only a little
      pull.y = dy > 0 ? dy : -(1 - 1 / (1 - dy * 0.02)) * 18;
      paintPull();
      drag.trail.push([e.timeStamp, e.clientY]);
      if (drag.trail.length > 6) drag.trail.shift();
    });
    const release = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag;
      drag = null;
      if (!d.on) return;
      swallowClick = true;
      const [t0, y0] = d.trail[0];
      const v = (e.clientY - y0) / Math.max(1, e.timeStamp - t0); // px per ms, down is positive
      if (pull.y > 70 || v > 0.11) close(false, true);
      else gsap.to(pull, { y: 0, duration: state.reduced ? 0 : 0.3, ease: 'power3.out', onUpdate: paintPull });
    };
    menu.addEventListener('pointerup', release);
    menu.addEventListener('pointercancel', release);
    // a pull is not a choice: the sheet under the finger is not opened
    menu.addEventListener('click', (e) => {
      if (!swallowClick) return;
      swallowClick = false;
      e.preventDefault();
      e.stopPropagation();
    }, true);
  }
  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
  }
  function onOutside(e) {
    if (!menu.contains(e.target) && !e.target.closest('[data-menu-open]')) close(false);
  }
  openers.forEach((b) => b.addEventListener('click', () => (state.menuOpen ? close() : open(b))));
  closer.addEventListener('click', () => close());
  menu.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    // another sheet: let the press feed it in; this sheet: carry the reader there
    if (!isHere(a)) { close(false); return; }
    e.preventDefault();
    close(false);
    scrollTo(a.dataset.hash || '#top');
  });
}

// ---------- language, sound and proof words ----------
export function initWords({ onLang, onProof, onStill }) {
  // phones: the tab bar's language word opens the three languages above it
  const pop = $('[data-langpop]');
  const toggles = $$('[data-lang-toggle]');
  const closePop = (returnFocus = false) => {
    if (!pop || pop.hidden) return;
    pop.hidden = true;
    toggles.forEach((t) => t.setAttribute('aria-expanded', 'false'));
    document.removeEventListener('pointerdown', onOutside, true);
    document.removeEventListener('keydown', onEsc);
    if (returnFocus) toggles[0]?.focus();
  };
  function onOutside(e) { if (!pop.contains(e.target) && !e.target.closest('[data-lang-toggle]')) closePop(); }
  function onEsc(e) { if (e.key === 'Escape') { e.preventDefault(); closePop(true); } }
  toggles.forEach((t) => t.addEventListener('click', () => {
    if (!pop) return;
    if (!pop.hidden) { closePop(); return; }
    judder(t);
    pop.hidden = false;
    t.setAttribute('aria-expanded', 'true');
    sound.paper();
    pop.querySelector('[aria-pressed="true"]')?.focus();
    document.addEventListener('pointerdown', onOutside, true);
    document.addEventListener('keydown', onEsc);
  }));

  $$('[data-lang]').forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.lang !== state.lang) { judder(b.parentElement); onLang(b.dataset.lang); }
    closePop(b.closest('[data-langpop]') !== null);
  }));

  const soundBtn = $('[data-sound]');
  const soundLabel = $('[data-sound-label]');
  const paintSound = () => {
    soundBtn.setAttribute('aria-pressed', String(state.sound));
    soundLabel.textContent = state.sound ? state.T.soundOn : state.T.soundOff;
  };
  soundBtn.addEventListener('click', () => { sound.enable(!state.sound); paintSound(); judder(soundBtn); sound.press(); });

  const proofBtn = $('[data-proof]');
  const proofLabel = $('[data-proof-label]');
  const paintProof = () => {
    proofBtn.setAttribute('aria-pressed', String(state.proof));
    proofLabel.textContent = state.proof ? state.T.proofOn : state.T.proof;
  };
  proofBtn.addEventListener('click', () => { onProof(!state.proof); paintProof(); judder(proofBtn); sound.press(); });

  // stop the press: everything that moves by itself stops, and stays stopped on every sheet
  const stillBtn = $('[data-still]');
  const stillLabel = $('[data-still-label]');
  const paintStill = () => {
    if (!stillBtn) return;
    stillBtn.setAttribute('aria-pressed', String(state.still));
    stillLabel.textContent = state.still ? state.T.stillOn : state.T.still;
    stillBtn.setAttribute('aria-label', state.still ? state.T.stillOnName : state.T.stillName);
  };
  stillBtn?.addEventListener('click', () => { onStill(!state.still); paintStill(); sound.press(); });

  const NAMES = { en: 'English', sq: 'Shqip', it: 'Italiano' };
  const paintLang = () => {
    $$('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === state.lang)));
    // the tab bar's word is the language the sheet is in; tapping it offers the others
    $$('[data-lang-toggle]').forEach((b) => {
      b.textContent = state.lang.toUpperCase();
      b.lang = state.lang;
      // the name starts with the word it shows (EN, SQ, IT), then says what it is
      b.setAttribute('aria-label', `${state.lang.toUpperCase()}, ${state.T.langLabel}: ${NAMES[state.lang]}`);
    });
  };
  const paint = () => { paintSound(); paintProof(); paintStill(); paintLang(); };
  paint();
  bus.on('lang', paint);
  return paint;
}
