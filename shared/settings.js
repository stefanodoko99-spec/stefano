// The site's settings: what the admin panel edits and the Worker stores (KV
// key "settings"). One module for both sides, so the admin checks a field
// exactly the way the Worker will. Every optional part of the site is off
// until it is switched on AND has what it needs, and everything shown comes
// from here, typed by a person: nothing is ever invented. The one part that
// starts on is the rate card, with the menu (shared/menu.js), asked for on
// 2026-09-26 so the prices are on the site before anyone signs in; the admin
// can change every line of it, or switch it off. The lines ticked as the best
// options (2026-09-28) are offered first, on the front page.
import { MENU, MENU_CURRENCY } from './menu.js';

export const PLACEHOLDER_EMAIL = 'hello@example.invalid';

// The site's languages. Every text typed in the admin has a line for each;
// the Italian ones may stay empty, and an Italian page then shows the English.
export const LANGS = ['en', 'sq', 'it'];

// The optional parts of the site, in the order the admin lists them.
export const FEATURES = ['whatsapp', 'availability', 'links', 'vcard', 'rates', 'calculator', 'portrait', 'graphic', 'quotes', 'greta', 'print', 'masthead', 'magnifier', 'analytics'];

// Where Stefano's work can also be followed, with the address each must be on.
export const LINKS = { instagram: /(^|\.)instagram\.com$/, facebook: /(^|\.)(facebook|fb)\.com$/, linkedin: /(^|\.)linkedin\.com$/, behance: /(^|\.)behance\.net$/ };

// a month, as <input type="month"> gives it: "2026-10"
export const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
// a Cloudflare Web Analytics site token, as its dashboard gives it
export const TOKEN_RE = /^[a-f0-9]{32}$/i;

export const LIMITS = {
  email: 120, itemName: 60, itemDesc: 180, note: 240, quote: 600, person: 60, business: 80,
  caption: 160, url: 200, rates: 24, unit: 30, quotes: 12, price: 100000000, graphic: 12, title: 80, client: 80,
};

// The groups a rate may stand under on the card, in the card's order: the
// websites, the design, the marketing, what can be added to a site, the care
// each month, and the work of a season. A rate in no group stands at the top
// of the card, as every rate did before there were groups.
export const RATE_GROUPS = ['sites', 'design', 'marketing', 'extras', 'monthly', 'season'];

export const CURRENCIES = ['ALL', 'EUR'];

const blank = () => Object.fromEntries(LANGS.map((l) => [l, '']));

export function defaults() {
  return {
    version: 2,
    updatedAt: '',
    email: '',
    whatsapp: '',
    // the month Stefano can take new work from ("Available for new work from October 2026")
    availability: { from: '' },
    // every part off but the rate card, which starts with the menu
    features: Object.fromEntries(FEATURES.map((f) => [f, f === 'rates'])),
    links: Object.fromEntries(Object.keys(LINKS).map((k) => [k, ''])),
    rates: { currency: MENU_CURRENCY, note: blank(), items: MENU.map((it) => ({ id: newId(), ...JSON.parse(JSON.stringify(it)) })) },
    portrait: { key: '', w: 0, h: 0, caption: blank() },
    // graphic work: each piece's photo is set by its upload only, never by a save
    graphic: [],
    quotes: [],
    greta: { url: '' },
    analytics: { token: '' },
  };
}

export const newId = () => `${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-5)}`;
export const EMAIL_RE = /^[^\s@<>"'`]+@[^\s@<>"'`]+\.[a-z]{2,}$/i;
export const digits = (v) => (typeof v === 'string' ? v.replace(/\D/g, '') : '');
export const isWhatsApp = (d) => /^\d{8,15}$/.test(d);
export const isEmail = (v) => typeof v === 'string' && EMAIL_RE.test(v) && v.toLowerCase() !== PLACEHOLDER_EMAIL;

// text as typed: line breaks kept (quotes), or folded to one line (everything else)
const text = (v, max) => (typeof v === 'string' ? v.replace(/\r\n?/g, '\n').replace(/[^\S\n]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, max) : '');
const line = (v, max) => text(v, max).replace(/\s+/g, ' ');
/** The same text in each of the site's languages. */
const langs = (v, max, keepBreaks = false) => Object.fromEntries(LANGS.map((l) => [l, (keepBreaks ? text : line)(v?.[l], max)]));
const anyLang = (o) => LANGS.some((l) => o?.[l]);
const cleanId = (v) => (typeof v === 'string' && /^[a-z0-9]{6,24}$/.test(v) ? v : newId());

/** An https address, or '' when there is none; null when what was typed is not one. */
export function httpsUrl(v) {
  const raw = line(v, LIMITS.url);
  if (!raw) return '';
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`);
    if (u.protocol !== 'https:' || !u.hostname.includes('.') || u.username || u.password) return null;
    return u.href;
  } catch {
    return null;
  }
}

/**
 * A profile's address on its own service, or '' when there is none; null when
 * what was typed is not one. An Instagram name alone ("@stefano") is enough.
 */
export function profileUrl(kind, v) {
  const raw = line(v, LIMITS.url);
  if (!raw) return '';
  if (kind === 'instagram' && /^@?[a-z0-9._]{1,30}$/i.test(raw)) return `https://www.instagram.com/${raw.replace(/^@/, '')}/`;
  const url = httpsUrl(raw);
  if (!url) return null;
  return LINKS[kind]?.test(new URL(url).hostname) ? url : null;
}

/** A whole number of the currency, or null. Accepts "12 000", "12.000", "12,000". */
export function price(v) {
  if (typeof v === 'number') return Number.isInteger(v) && v >= 0 && v <= LIMITS.price ? v : null;
  const s = typeof v === 'string' ? v.replace(/[\s.,'’]/g, '') : '';
  if (!/^\d{1,9}$/.test(s)) return null;
  const n = Number(s);
  return n <= LIMITS.price ? n : null;
}

/**
 * Clean an edited copy for storage. Returns { value, errors }; errors maps a
 * field path to a reason the admin shows beside that field. Stored files (the
 * portrait, the pieces of graphic work) are never taken from the edit: only
 * their upload routes set them.
 */
export function clean(input, current = defaults()) {
  const src = input && typeof input === 'object' ? input : {};
  const cur = current && typeof current === 'object' ? current : defaults();
  const out = defaults();
  const errors = {};

  const email = line(src.email, LIMITS.email);
  if (email && !isEmail(email)) errors.email = 'email';
  out.email = email;

  const wa = digits(src.whatsapp);
  if (wa && !isWhatsApp(wa)) errors.whatsapp = 'whatsapp';
  out.whatsapp = wa;

  const from = line(src.availability?.from, 7);
  if (from && !MONTH_RE.test(from)) errors['availability.from'] = 'month';
  out.availability.from = MONTH_RE.test(from) ? from : '';

  for (const f of FEATURES) out.features[f] = src.features?.[f] === true;

  for (const kind of Object.keys(LINKS)) {
    const url = profileUrl(kind, src.links?.[kind]);
    if (url === null) errors[`links.${kind}`] = 'profile';
    out.links[kind] = url || '';
  }

  const rates = src.rates && typeof src.rates === 'object' ? src.rates : {};
  out.rates.currency = CURRENCIES.includes(rates.currency) ? rates.currency : 'ALL';
  // the edit's rates only: the menu the defaults start from is not added to them
  out.rates.items = [];
  out.rates.note = langs(rates.note, LIMITS.note);
  (Array.isArray(rates.items) ? rates.items : []).slice(0, LIMITS.rates).forEach((it) => {
    const name = langs(it?.name, LIMITS.itemName);
    const desc = langs(it?.desc, LIMITS.itemDesc);
    // what the price is per ("photo"); a rate in "monthly" is per month without one
    const unit = langs(it?.unit, LIMITS.unit);
    const rawPrice = typeof it?.price === 'number' ? it.price : line(it?.price, 16);
    if (!anyLang(name) && !anyLang(desc) && !anyLang(unit) && rawPrice === '') return; // a blank row
    const i = out.rates.items.length;
    const p = price(rawPrice);
    if (!name.en && !name.sq) errors[`rates.items.${i}.name`] = 'required';
    if (p === null) errors[`rates.items.${i}.price`] = 'price';
    const group = RATE_GROUPS.includes(it?.group) ? it.group : '';
    out.rates.items.push({ id: cleanId(it?.id), name, desc, price: p ?? 0, from: it?.from === true, best: it?.best === true, group, unit });
  });

  const kept = cur.portrait && typeof cur.portrait === 'object' ? cur.portrait : {};
  out.portrait = {
    key: typeof kept.key === 'string' ? kept.key : '',
    w: Number.isInteger(kept.w) ? kept.w : 0,
    h: Number.isInteger(kept.h) ? kept.h : 0,
    caption: langs(src.portrait?.caption, LIMITS.caption),
  };

  // a piece keeps the photo its upload stored under its id; one the edit made up has none, and is dropped
  const stored = new Map((Array.isArray(cur.graphic) ? cur.graphic : []).map((g) => [g?.id, g]));
  (Array.isArray(src.graphic) ? src.graphic : []).slice(0, LIMITS.graphic).forEach((g) => {
    const had = stored.get(g?.id);
    if (!had || typeof had.key !== 'string' || !had.key) return;
    const year = line(g?.year, 4);
    const i = out.graphic.length;
    if (year && !/^(19|20)\d{2}$/.test(year)) errors[`graphic.${i}.year`] = 'year';
    out.graphic.push({
      id: had.id,
      key: had.key,
      w: Number.isInteger(had.w) ? had.w : 0,
      h: Number.isInteger(had.h) ? had.h : 0,
      title: langs(g?.title, LIMITS.title),
      client: line(g?.client, LIMITS.client),
      year: /^(19|20)\d{2}$/.test(year) ? year : '',
      permission: g?.permission === true,
    });
  });

  (Array.isArray(src.quotes) ? src.quotes : []).slice(0, LIMITS.quotes).forEach((q) => {
    const body = text(q?.text, LIMITS.quote);
    const name = line(q?.name, LIMITS.person);
    const business = line(q?.business, LIMITS.business);
    const translation = text(q?.translation, LIMITS.quote);
    if (!body && !name && !business && !translation) return; // a blank row
    const i = out.quotes.length;
    if (!body) errors[`quotes.${i}.text`] = 'required';
    if (!name) errors[`quotes.${i}.name`] = 'required';
    out.quotes.push({ id: cleanId(q?.id), text: body, lang: q?.lang === 'en' ? 'en' : 'sq', translation, name, business, permission: q?.permission === true });
  });

  const url = httpsUrl(src.greta?.url);
  if (url === null) errors['greta.url'] = 'url';
  out.greta.url = url || '';

  const token = line(src.analytics?.token, 64);
  if (token && !TOKEN_RE.test(token)) errors['analytics.token'] = 'token';
  out.analytics.token = TOKEN_RE.test(token) ? token.toLowerCase() : '';

  return { value: out, errors };
}

/** A piece of graphic work that may be shown: a photo, a title, and the client's permission. */
export const showable = (g) => !!(g?.key && g.permission && anyLang(g.title));

/** For each optional part: is it switched on, does it have what it needs, and so is it live. */
export function status(s) {
  const ratesReady = s.rates.items.some((i) => (i.name.en || i.name.sq) && Number.isInteger(i.price));
  const has = {
    whatsapp: isWhatsApp(s.whatsapp) ? [] : ['whatsapp'],
    availability: MONTH_RE.test(s.availability.from) ? [] : ['month'],
    links: Object.values(s.links).some(Boolean) ? [] : ['profileLink'],
    vcard: isEmail(s.email) ? [] : ['email'],
    rates: ratesReady ? [] : ['rateItem'],
    // the calculator is part of the rate card: it shows only while the card does
    calculator: s.features.rates === true && ratesReady ? [] : ['ratesLive'],
    portrait: s.portrait.key ? [] : ['photo'],
    graphic: s.graphic.some(showable) ? [] : ['permittedPiece'],
    quotes: s.quotes.some((q) => q.permission && q.text && q.name) ? [] : ['permittedQuote'],
    greta: s.greta.url ? [] : ['gretaUrl'],
    print: [], masthead: [], magnifier: [],
    analytics: TOKEN_RE.test(s.analytics.token) ? [] : ['analyticsToken'],
  };
  return Object.fromEntries(FEATURES.map((f) => {
    const on = s.features[f] === true;
    const needs = has[f];
    return [f, { on, ready: needs.length === 0, live: on && needs.length === 0, needs }];
  }));
}

/** What a page may know: only what is live, and only what a visitor would see anyway. */
export function publicView(s) {
  const st = status(s);
  const live = FEATURES.filter((f) => st[f].live);
  const on = (f) => st[f].live;
  return {
    email: isEmail(s.email) ? s.email : '',
    live,
    whatsapp: on('whatsapp') ? s.whatsapp : '',
    availability: on('availability') ? { from: s.availability.from } : null,
    links: on('links') ? Object.keys(LINKS).filter((k) => s.links[k]).map((kind) => ({ kind, url: s.links[kind] })) : [],
    rates: on('rates')
      ? {
          currency: s.rates.currency,
          note: s.rates.note,
          items: s.rates.items.filter((i) => i.name.en || i.name.sq).map(({ name, desc, price: p, from, best, group, unit }) => ({ name, desc, price: p, from, best, group, unit })),
        }
      : null,
    portrait: on('portrait') ? { src: `/${s.portrait.key}`, w: s.portrait.w, h: s.portrait.h, caption: s.portrait.caption } : null,
    graphic: on('graphic') ? s.graphic.filter(showable).map(({ key, w, h, title, client, year }) => ({ src: `/${key}`, w, h, title, client, year })) : [],
    quotes: on('quotes') ? s.quotes.filter((q) => q.permission && q.text && q.name).map(({ text: t, lang, translation, name, business }) => ({ text: t, lang, translation, name, business })) : [],
    greta: on('greta') ? { url: s.greta.url, host: new URL(s.greta.url).hostname.replace(/^www\./, '') } : null,
    // the analytics token goes into its own script tag (worker/inject.js); the page only needs to say it counts
    counted: on('analytics'),
    inbox: true,
  };
}

// the menu's best options, by group and English name
const MENU_BEST = new Set(MENU.filter((it) => it.best).map((it) => `${it.group}|${it.name.en}`));

/** Stored settings (maybe from an older version, maybe partial) laid over the defaults. */
export function merged(stored) {
  if (!stored || typeof stored !== 'object') return defaults();
  const { value } = clean(stored, stored);
  value.updatedAt = typeof stored.updatedAt === 'string' ? stored.updatedAt : '';
  // rates saved before there were best options take the menu's: its lines, where they are still on the card
  const items = Array.isArray(stored.rates?.items) ? stored.rates.items : [];
  if (!items.some((it) => it && typeof it === 'object' && 'best' in it)) {
    value.rates.items.forEach((it) => { it.best = MENU_BEST.has(`${it.group}|${it.name.en}`); });
  }
  return value;
}
