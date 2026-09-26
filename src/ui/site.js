// The admin's settings, as the Worker wrote them into this page
// (<script id="site-settings">, worker/inject.js), and the optional parts of
// the sheet they switch on: WhatsApp, availability, his profiles, his card,
// the rate card, the letters, the portrait's caption, the graphic work,
// Greta's link, and the privacy lines (the inbox, the visit counter). A page
// served without the Worker has no settings of its own: it takes the ones a
// fresh admin starts from, so the rate card shows the menu and every other
// optional part stays off. Everything shown here was typed in the admin or is
// the menu (shared/menu.js); it is put on the page as text, never as HTML.
import { state } from '../state.js';
import { albaniaNow } from '../i18n.js';
import { pathFor } from '../routes.js';
import { vcard } from '../../shared/vcard.js';
import { RATE_GROUPS, defaults, publicView } from '../../shared/settings.js';
import { qrElement } from './qr.js';

export const site = { email: '', live: new Set(), whatsapp: '', availability: null, links: [], rates: null, portrait: null, graphic: [], quotes: [], greta: null, counted: false, inbox: false };
export const has = (f) => site.live.has(f);

// the services a profile may be on, as each writes its own name
const LINK_NAMES = { instagram: 'Instagram', facebook: 'Facebook', linkedin: 'LinkedIn', behance: 'Behance' };

export function readSite() {
  const el = document.getElementById('site-settings');
  let s;
  try {
    // without the Worker: a fresh admin's settings, and no inbox to post a telegram to
    s = el ? JSON.parse(el.textContent) : { ...publicView(defaults()), inbox: false };
  } catch { /* settings that do not read leave the page as it was built */ }
  if (!s || typeof s !== 'object') return site;
  site.email = typeof s.email === 'string' ? s.email : '';
  site.live = new Set(Array.isArray(s.live) ? s.live : []);
  site.whatsapp = typeof s.whatsapp === 'string' && /^\d{8,15}$/.test(s.whatsapp) ? s.whatsapp : '';
  site.availability = s.availability && /^\d{4}-(0[1-9]|1[0-2])$/.test(s.availability.from || '') ? s.availability : null;
  site.links = Array.isArray(s.links) ? s.links.filter((l) => LINK_NAMES[l?.kind] && /^https:\/\//.test(l.url || '')) : [];
  site.rates = s.rates && Array.isArray(s.rates.items) ? s.rates : null;
  site.portrait = s.portrait && typeof s.portrait.src === 'string' && s.portrait.src.startsWith('/media/') ? s.portrait : null;
  site.graphic = Array.isArray(s.graphic) ? s.graphic.filter((g) => typeof g?.src === 'string' && g.src.startsWith('/media/')) : [];
  site.quotes = Array.isArray(s.quotes) ? s.quotes : [];
  site.greta = s.greta && /^https:\/\//.test(s.greta.url || '') ? s.greta : null;
  site.counted = s.counted === true;
  site.inbox = s.inbox === true;
  return site;
}

const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};

/** The admin's text in this language; else the English, else the Albanian (Italian may be left empty). */
export const pick = (text, lang) => text?.[lang] || text?.en || text?.sq || '';

const NBSP = String.fromCharCode(160);

/** 12000 ALL as a reader expects it: "12,000 ALL" in English, "12.000 lekë" in Albanian, "12.000 ALL" in Italian. */
export function money(n, currency, lang) {
  const s = String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, lang === 'en' ? ',' : '.');
  if (currency === 'EUR') return lang === 'en' ? `€${s}` : `${s}${NBSP}€`;
  return lang === 'sq' ? `${s}${NBSP}lekë` : `${s}${NBSP}ALL`;
}

/** What a rate is per, in this language: its own unit, else a month for the care each month; '' when it is paid once. */
export const perOf = (T, lang, it) => pick(it.unit, lang) || (it.group === 'monthly' ? T.rateMonth : '');

/** A rate's price as the card sets it: "from €150" (its unit, "/ month", is set apart). */
export const priceOnly = (T, lang, it) => `${it.from ? `${T.rateFrom} ` : ''}${money(it.price, site.rates.currency, lang)}`;

/** A rate's price with its unit, as one line of text: "from €10 / month". */
export function priceText(T, lang, it) {
  const per = perOf(T, lang, it);
  return per ? `${priceOnly(T, lang, it)} / ${per}` : priceOnly(T, lang, it);
}

/** The rates as the card lays them out: those in no group first, then each group in the card's order; each rate with its place in the list. */
export function rateGroups(items) {
  const groups = new Map([['', []], ...RATE_GROUPS.map((g) => [g, []])]);
  items.forEach((it, i) => groups.get(RATE_GROUPS.includes(it.group) ? it.group : '').push([it, i]));
  return [...groups].filter(([, list]) => list.length);
}

/** +355 69 000 0000 for an Albanian number; +digits for any other. */
export function prettyPhone(d) {
  if (/^355\d{9}$/.test(d)) return `+355 ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8)}`;
  return `+${d}`;
}

export const whatsappHref = (T) => `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(T.waHello)}`;

function paintMail() {
  // the Worker already wrote the address in; this keeps it right if a text arrived in pieces
  if (!site.email) return;
  document.querySelectorAll('a[data-mail]').forEach((a) => { a.href = `mailto:${site.email}`; });
  document.querySelectorAll('[data-mail-text]').forEach((e) => { if (e.textContent.trim() !== site.email) e.textContent = site.email; });
}

function paintWhatsApp(T) {
  const on = has('whatsapp') && !!site.whatsapp;
  document.querySelectorAll('[data-whatsapp]').forEach((a) => {
    a.hidden = !on;
    if (!on) return;
    a.href = whatsappHref(T);
    a.target = '_blank';
    a.rel = 'noopener';
  });
  document.querySelectorAll('[data-whatsapp-number]').forEach((s) => { s.textContent = on ? prettyPhone(site.whatsapp) : ''; });
  document.querySelectorAll('[data-whatsapp-line]').forEach((p) => { p.hidden = !on; });
}

// this month in Albania, as "2026-09" (en-CA writes the year first)
const thisMonth = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Tirane', year: 'numeric', month: '2-digit' }).format(new Date());

/** "Available for new work from October 2026", or "now" once that month has come. */
export function availLine(T) {
  if (!site.availability) return '';
  const from = site.availability.from;
  if (from <= thisMonth()) return T.availNow;
  const [y, m] = from.split('-').map(Number);
  return T.availFrom(`${T.monthsFrom[m - 1]} ${y}`);
}

function paintAvailability(T) {
  const on = has('availability') && !!site.availability;
  document.querySelectorAll('[data-avail]').forEach((p) => {
    p.hidden = !on;
    if (on) p.querySelector('[data-avail-text]').textContent = availLine(T);
  });
}

// the group the menu shows, kept when the language changes
let shownGroup = null;

function paintRates(T, lang) {
  const sec = document.querySelector('[data-optional="rates"]');
  if (!sec) return;
  const on = has('rates') && !!site.rates && site.rates.items.length > 0;
  sec.hidden = !on;
  if (!on) return;
  const rate = (it) => {
    const li = el('li', 'rate');
    const desc = pick(it.desc, lang);
    const leader = el('span', 'rate__leader');
    leader.setAttribute('aria-hidden', 'true');
    // "from" set small before the price, as on the flyers
    const price = el('span', 'rate__price');
    if (it.from) price.append(el('span', 'rate__from', `${T.rateFrom} `));
    price.append(money(it.price, site.rates.currency, lang));
    const per = perOf(T, lang, it);
    if (per) price.append(el('span', 'rate__per', ` / ${per}`));
    li.append(el('span', 'rate__name', pick(it.name, lang)), leader, price);
    if (desc) li.append(el('span', 'rate__desc', desc));
    return li;
  };
  // The menu, compact: a tab for each group (the rates in no group first,
  // under the card's own name), one group's list shown at a time. The lists
  // share one place on the card, so it keeps the height of the longest and
  // nothing under it moves as the tabs change.
  const groups = rateGroups(site.rates.items);
  const tabs = sec.querySelector('[data-rates-tabs]');
  const panels = groups.map(([group, list]) => {
    const panel = el('div', 'ratecard__panel');
    panel.id = `rates-${group || 'top'}`;
    const ol = el('ol', 'ratecard__list');
    ol.append(...list.map(([it]) => rate(it)));
    panel.append(ol);
    return panel;
  });
  sec.querySelector('[data-rates-list]').replaceChildren(...panels);
  tabs.hidden = groups.length < 2;
  if (groups.length < 2) {
    tabs.replaceChildren();
    panels[0].classList.add('is-shown');
  } else {
    tabs.setAttribute('role', 'tablist');
    tabs.setAttribute('aria-label', T.ratesKind);
    const buttons = groups.map(([group, list], i) => {
      const b = el('button', 'ratecard__tab');
      b.type = 'button';
      b.id = `rates-tab-${group || 'top'}`;
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-controls', panels[i].id);
      b.append(el('span', '', group ? T.rateGroups[group] : T.ratesKind), el('span', 'ratecard__n', String(list.length)));
      panels[i].setAttribute('role', 'tabpanel');
      panels[i].setAttribute('aria-labelledby', b.id);
      panels[i].tabIndex = 0;
      return b;
    });
    const select = (i, focus) => {
      shownGroup = groups[i][0];
      buttons.forEach((b, j) => { b.setAttribute('aria-selected', String(i === j)); b.tabIndex = i === j ? 0 : -1; });
      panels.forEach((p, j) => { p.classList.toggle('is-shown', i === j); p.inert = i !== j; });
      if (focus) buttons[i].focus({ preventScroll: true });
      // on a narrow card the row of tabs runs sideways: the chosen one is brought into it
      const b = buttons[i];
      if (tabs.scrollWidth > tabs.clientWidth) tabs.scrollTo({ left: Math.max(0, b.offsetLeft - (tabs.clientWidth - b.offsetWidth) / 2), behavior: state.reduced ? 'auto' : 'smooth' });
    };
    buttons.forEach((b, i) => {
      b.addEventListener('click', () => select(i));
      // the arrow keys move along the tabs, Home and End to either end
      b.addEventListener('keydown', (e) => {
        const n = buttons.length;
        const to = { ArrowRight: (i + 1) % n, ArrowLeft: (i + n - 1) % n, Home: 0, End: n - 1 }[e.key];
        if (to === undefined) return;
        e.preventDefault();
        select(to, true);
      });
    });
    tabs.replaceChildren(...buttons);
    select(Math.max(0, groups.findIndex(([g]) => g === shownGroup)));
  }
  const note = pick(site.rates.note, lang);
  const noteEl = sec.querySelector('[data-rates-note]');
  noteEl.textContent = note;
  noteEl.hidden = !note;
}

function paintQuotes(T, lang) {
  const sec = document.querySelector('[data-optional="quotes"]');
  if (!sec) return;
  const on = has('quotes') && site.quotes.length > 0;
  sec.hidden = !on;
  if (!on) return;
  // a quote is written in Albanian or English, and translated into the other: an Italian page shows the English
  const want = lang === 'it' ? 'en' : lang;
  sec.querySelector('[data-quotes]').replaceChildren(...site.quotes.map((q) => {
    // a quote in the other language shows its translation, when there is one, and says so
    const translated = q.lang !== want && !!q.translation;
    const fig = el('figure', 'reader');
    const said = el('blockquote', 'reader__text', translated ? q.translation : q.text);
    said.lang = translated ? want : q.lang;
    const who = el('figcaption', 'reader__who');
    who.append(el('b', '', q.name));
    if (q.business) who.append(`, ${q.business}`);
    if (translated) who.append(el('span', 'reader__tr', T.quoteTranslated[q.lang] || ''));
    fig.append(said, who);
    return fig;
  }));
}

function paintPortrait(T, lang) {
  const fig = document.querySelector('[data-optional="portrait"]');
  if (!fig) return;
  const on = has('portrait') && !!site.portrait;
  fig.hidden = !on;
  if (!on) return;
  const img = fig.querySelector('img');
  if (img.getAttribute('src') !== site.portrait.src) {
    img.width = site.portrait.w;
    img.height = site.portrait.h;
    img.src = site.portrait.src;
  }
  const cap = fig.querySelector('[data-portrait-cap]');
  const text = pick(site.portrait.caption, lang);
  cap.textContent = text;
  cap.hidden = !text;
}

function paintGreta(T) {
  const meta = document.querySelector('[data-greta-meta]');
  if (!meta) return;
  const on = has('greta') && !!site.greta;
  meta.hidden = !on;
  if (!on) return;
  const a = meta.querySelector('a');
  a.href = site.greta.url;
  a.querySelector('[data-greta-label]').textContent = `${T.visitWord} ${site.greta.host}`;
}

function paintLinks() {
  const on = has('links') && site.links.length > 0;
  document.querySelectorAll('[data-optional="links"]').forEach((p) => {
    p.hidden = !on;
    if (!on) return;
    p.querySelector('[data-links-list]').replaceChildren(...site.links.map((l) => {
      const a = el('a', 'word', LINK_NAMES[l.kind]);
      a.href = l.url;
      a.target = '_blank';
      a.rel = 'me noopener';
      return a;
    }));
  });
}

// his card: the download in this language, and on a wider screen a QR code of
// the whole card, for a phone to read off the screen (a phone cannot scan itself)
function paintCard(lang) {
  const sec = document.querySelector('[data-optional="vcard"]');
  if (!sec) return;
  const on = has('vcard') && !!site.email;
  sec.hidden = !on;
  if (!on) return;
  sec.querySelector('[data-vcard]').href = `/stefano-doko.vcf${lang === 'en' ? '' : `?lang=${lang}`}`;
  const fig = sec.querySelector('[data-vcard-qr]');
  if (state.mobile) { fig.hidden = true; return; }
  const text = vcard({ email: site.email, phone: has('whatsapp') ? site.whatsapp : '', url: new URL(pathFor('home', lang), location.href).href, lang });
  if (fig.dataset.card === text) return;
  fig.dataset.card = text;
  qrElement(text, 'card__code', 'L').then((svg) => {
    if (fig.dataset.card !== text) return;
    fig.querySelector('.card__code')?.remove();
    fig.prepend(svg);
  }).catch(() => { fig.hidden = true; });
}

// Graphic work: each piece a plate, numbered on from the front page's six
// figures. The figures are built once (the stage holds on to their pictures,
// src/ui/graphic.js); a language switch rewrites only their words.
const FIRST_FIG = 7;
function paintGraphic(T, lang) {
  const on = has('graphic') && site.graphic.length > 0;
  document.querySelectorAll('[data-optional="graphic"]').forEach((e) => { e.hidden = !on; });
  const box = document.querySelector('[data-graphic]');
  if (!box || !on) return;
  if (box.childElementCount !== site.graphic.length) {
    box.replaceChildren(...site.graphic.map((g, i) => {
      const fig = el('figure', 'plate piece');
      fig.dataset.plate = `graphic-${i}`;
      const mount = el('div', 'plate__mount');
      const img = el('img');
      img.src = g.src;
      img.width = g.w;
      img.height = g.h;
      img.loading = 'lazy';
      img.decoding = 'async';
      mount.append(img);
      fig.append(mount, el('figcaption', 'plate__cap piece__cap'));
      return fig;
    }));
  }
  [...box.children].forEach((fig, i) => {
    const g = site.graphic[i];
    const title = pick(g.title, lang);
    const who = [g.client, g.year].filter(Boolean).join(', ');
    fig.querySelector('img').alt = who ? `${title}, ${who}` : title;
    const cap = fig.querySelector('figcaption');
    cap.replaceChildren(`Fig. ${FIRST_FIG + i}. `, el('b', 'piece__title', title), who ? `. ${who}.` : '.');
  });
}

function paintPrivacy(T) {
  // with the Worker, a telegram is kept for Stefano to read; with the visit
  // counter on, visits are counted: the notes say so
  const key = (base) => `${base}${site.counted ? 'Counted' : ''}`;
  const p = document.querySelector('[data-i18n^="ctPrivacy"]:not([data-i18n="ctPrivacyHead"]):not([data-i18n="ctPrivacyMore"])');
  if (p) {
    p.dataset.i18n = key(site.inbox ? 'ctPrivacyInbox' : 'ctPrivacy');
    p.textContent = T[p.dataset.i18n];
  }
  // the privacy page's line on counting visits
  const count = document.querySelector('[data-i18n^="pvCount"]:not([data-i18n="pvCountHead"])');
  if (count) {
    count.dataset.i18n = key('pvCount');
    count.textContent = T[count.dataset.i18n];
  }
  const runs = document.querySelector('[data-i18n^="mdRuns"]:not([data-i18n="mdRunsHead"])');
  if (runs) {
    runs.dataset.i18n = key('mdRuns');
    runs.textContent = T[runs.dataset.i18n];
  }
}

/** Everything the settings decide, in the page's language. Before fitting, and again on every language switch. */
export function applySite(T = state.T) {
  const lang = state.lang;
  paintMail();
  paintWhatsApp(T);
  paintAvailability(T);
  paintLinks();
  paintCard(lang);
  paintRates(T, lang);
  paintGraphic(T, lang);
  paintQuotes(T, lang);
  paintPortrait(T, lang);
  paintGreta(T);
  paintPrivacy(T);
  // the question of price: with the rate card on, it points there
  const price = document.querySelector('[data-faq-price]');
  if (price) price.textContent = has('rates') ? T.faqPriceRates : T.faqA[2];
  // the day the site was last set (tools/build-sq.mjs writes it), in the sheet's language
  document.querySelectorAll('[data-updated]').forEach((el) => {
    const at = new Date(el.dataset.updated || '');
    if (!Number.isNaN(at.getTime())) el.textContent = `${T.updated} ${albaniaNow(lang, true, at).date}`;
  });
  document.querySelectorAll('[data-optional="masthead"]').forEach((s) => { s.hidden = !has('masthead'); });
  document.querySelectorAll('[data-print]').forEach((b) => { b.hidden = !(has('print') && document.body.dataset.page === 'home'); });
}
