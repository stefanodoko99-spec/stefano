// The admin panel. One page, nine sections (the address's #hash picks one).
// Every edit goes into a draft; the save bar sends it, and the Worker checks
// it again with the same rules (shared/settings.js). Photographs are the
// exception: the portrait and each piece of graphic work are sent, and kept,
// as soon as they are chosen.
// Everything a visitor or the admin typed is put on the page as text, never
// as HTML.
import './admin.css';
import { api } from './api.js';
import { T, lang, setLang, fill, when } from './strings.js';
import { resizePhoto } from './image.js';
import { qrFile } from '../ui/qr.js';
import { vcard } from '../../shared/vcard.js';
import { FEATURES, CURRENCIES, LANGS, LINKS, LIMITS, RATE_GROUPS, clean, status as statusOf, newId, digits, isEmail, EMAIL_RE } from '../../shared/settings.js';
import { MENU, MENU_CURRENCY } from '../../shared/menu.js';

const app = document.getElementById('app');
const PANELS = ['overview', 'contact', 'rates', 'portrait', 'graphic', 'quotes', 'greta', 'visits', 'telegrams'];
const PANEL_OF = {
  whatsapp: 'contact', availability: 'contact', links: 'contact', vcard: 'contact', rates: 'rates', calculator: 'rates',
  portrait: 'portrait', graphic: 'graphic', quotes: 'quotes', greta: 'greta', analytics: 'visits',
};
const LINK_NAMES = { instagram: 'Instagram', facebook: 'Facebook', linkedin: 'LinkedIn', behance: 'Behance' };
const copy = (v) => JSON.parse(JSON.stringify(v));
const blankLangs = () => Object.fromEntries(LANGS.map((l) => [l, '']));

const S = {
  me: null,
  saved: null, // the settings as stored
  draft: null, // the settings being edited
  errors: {}, // field path -> reason
  unread: 0,
  panel: 'overview',
  dirty: false,
  saving: false,
  flash: '', // the save bar's last word: saved | fix | network | server
  photo: '', // the portrait's upload state: uploading | uploaded | an error code
  piece: { state: '', id: '' }, // a piece of graphic work's upload: its state, and which piece ('' for a new one)
  inbox: { items: [], cursor: '', loaded: false, open: null, confirm: false, busy: false },
};

/* ------------------------------------------------------------ building blocks ------------------------------------------------------------ */

function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'value' || k === 'checked') el[k] = v;
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid === null || kid === undefined || kid === false) continue;
    el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

const h1 = (text) => h('h1', { class: 'adm-h1', tabindex: '-1', text });
const help = (id, text) => (text ? h('p', { class: 'adm-help', id, text }) : null);

/** A labelled control with its help line and a place for its error. */
function field({ id, label, helpText, control, path }) {
  const helpId = `${id}-help`;
  const errId = `${id}-err`;
  control.id = id;
  if (path) control.dataset.path = path;
  const described = [helpText ? helpId : '', path ? errId : ''].filter(Boolean).join(' ');
  if (described) control.setAttribute('aria-describedby', described);
  return h('div', { class: 'adm-field' },
    h('label', { class: 'adm-label', for: id, text: label }),
    control,
    help(helpId, helpText),
    path ? h('p', { class: 'adm-err', id: errId, 'data-error': path }) : null);
}

function input(value, onInput, attrs = {}) {
  return h('input', { class: 'adm-input', type: 'text', value: value ?? '', oninput: (e) => { onInput(e.target.value); changed(); }, ...attrs });
}

function area(value, onInput, attrs = {}) {
  return h('textarea', { class: 'adm-input adm-input--area', rows: '4', value: value ?? '', oninput: (e) => { onInput(e.target.value); changed(); }, ...attrs });
}

/**
 * The same text in the site's languages, side by side: English and Albanian,
 * and Italian, which may stay empty (an Italian page then shows the English).
 */
function pair({ id, label, obj, max, multiline = false, helpText, path }) {
  const one = (l) => {
    const name = l === 'it' ? `${T().langName[l]}, ${T().optional}` : T().langName[l];
    const attrs = { maxlength: String(max), lang: l, 'aria-label': `${label} (${name})` };
    if (obj[l] === undefined) obj[l] = '';
    const control = multiline ? area(obj[l], (v) => { obj[l] = v; }, attrs) : input(obj[l], (v) => { obj[l] = v; }, attrs);
    control.id = `${id}-${l}`;
    if (path) control.dataset.path = `${path}.${l}`;
    return h('div', { class: `adm-pair__one${l === 'it' ? ' adm-pair__one--optional' : ''}` }, h('span', { class: 'adm-pair__lang', 'aria-hidden': 'true', text: l.toUpperCase() }), control);
  };
  return h('div', { class: 'adm-field' },
    h('span', { class: 'adm-label', id: `${id}-label`, text: label }),
    h('div', { class: 'adm-pair', role: 'group', 'aria-labelledby': `${id}-label` }, LANGS.map(one)),
    help(`${id}-help`, helpText),
    path ? h('p', { class: 'adm-err', 'data-error': path }) : null);
}

/** Off | On, like the site's language control. */
function toggle(f) {
  return h('div', { class: 'adm-switch', role: 'group', 'aria-label': T().features[f][0], 'data-switch': f },
    h('button', { type: 'button', class: 'adm-switch__opt', 'data-value': 'off', onclick: () => { S.draft.features[f] = false; changed(); }, text: T().off }),
    h('button', { type: 'button', class: 'adm-switch__opt', 'data-value': 'on', onclick: () => { S.draft.features[f] = true; changed(); }, text: T().on }));
}

const chip = (f) => h('span', { class: 'adm-chip', 'data-chip': f });

/** A feature's name, what it does, whether it shows, and its switch: at the top of its section. */
function featureLine(f) {
  return h('div', { class: 'adm-feature' },
    h('div', { class: 'adm-feature__text' }, h('p', { class: 'adm-feature__name', text: T().features[f][0] }), h('p', { class: 'adm-help', text: T().features[f][1] })),
    chip(f), toggle(f));
}

function listButtons(list, i, rerender) {
  const move = (d) => { const j = i + d; [list[i], list[j]] = [list[j], list[i]]; changed(); rerender(); };
  return h('div', { class: 'adm-row-actions' },
    h('button', { type: 'button', class: 'adm-word', disabled: i === 0, onclick: () => move(-1), text: T().move.up }),
    h('button', { type: 'button', class: 'adm-word', disabled: i === list.length - 1, onclick: () => move(1), text: T().move.down }),
    h('button', { type: 'button', class: 'adm-word adm-word--danger', onclick: () => { list.splice(i, 1); changed(); rerender(); }, text: T().move.remove }));
}

/* ----------------------------------------------------------------- state ----------------------------------------------------------------- */

const draftStatus = () => statusOf(clean(S.draft, S.saved).value);

function take(data) {
  S.saved = data.settings;
  S.draft = copy(data.settings);
  S.unread = data.unread ?? S.unread;
  S.errors = {};
  S.dirty = false;
}

function changed() {
  S.dirty = true;
  if (S.flash === 'saved') S.flash = '';
  refreshChrome();
}

function signedOut() {
  S.me = { ...(S.me || {}), admin: false };
  renderLogin();
}

function fail(e) {
  if (e?.status === 401) { signedOut(); return true; }
  return false;
}

/** Everything that follows the draft without rebuilding the section: switches, chips, the save bar, errors. */
function refreshChrome() {
  if (!S.draft) return;
  const st = draftStatus();
  app.querySelectorAll('[data-switch]').forEach((g) => {
    const on = S.draft.features[g.dataset.switch] === true;
    g.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.value === 'on') === on)));
  });
  // an off part says nothing more than its switch does; an on part says whether it shows, or what it waits for
  app.querySelectorAll('[data-chip]').forEach((c) => {
    const s = st[c.dataset.chip];
    c.className = `adm-chip adm-chip--${s.live ? 'live' : 'needs'}`;
    c.hidden = !s.on;
    c.textContent = s.live ? T().chip.live : s.on ? `${T().chip.needs}: ${s.needs.map((n) => T().needs[n]).join(', ')}` : '';
  });
  app.querySelectorAll('[data-error]').forEach((el) => {
    const code = S.errors[el.dataset.error];
    el.textContent = code ? T().field[code] || T().field.required : '';
  });
  app.querySelectorAll('[data-path]').forEach((el) => {
    const bad = Object.keys(S.errors).some((p) => p === el.dataset.path || el.dataset.path.startsWith(`${p}.`));
    if (bad) el.setAttribute('aria-invalid', 'true');
    else el.removeAttribute('aria-invalid');
  });
  const bar = app.querySelector('[data-savebar]');
  if (bar) {
    bar.hidden = !(S.dirty || S.flash);
    const msg = S.saving ? T().save.saving : S.flash === 'saved' ? T().save.saved : S.flash === 'fix' ? T().save.fix : S.flash ? T().errors[S.flash] || T().errors.server : T().save.dirty;
    bar.querySelector('[data-savemsg]').textContent = msg;
    bar.querySelector('[data-save]').disabled = S.saving || !S.dirty;
    bar.querySelector('[data-discard]').disabled = S.saving || !S.dirty;
  }
  const badge = app.querySelector('[data-unread]');
  if (badge) { badge.textContent = S.unread ? String(S.unread) : ''; badge.hidden = !S.unread; }
}

async function save() {
  const { value, errors } = clean(S.draft, S.saved);
  if (Object.keys(errors).length) {
    S.errors = errors;
    S.flash = 'fix';
    refreshChrome();
    app.querySelector('[aria-invalid="true"]')?.focus();
    return;
  }
  S.saving = true;
  refreshChrome();
  try {
    take(await api.save(value));
    S.flash = 'saved';
    S.saving = false;
    renderApp();
  } catch (e) {
    S.saving = false;
    if (fail(e)) return;
    if (e.code === 'invalid') { S.errors = e.data?.errors || {}; S.flash = 'fix'; } else S.flash = e.code === 'network' ? 'network' : 'server';
    refreshChrome();
  }
}

function discard() {
  S.draft = copy(S.saved);
  S.errors = {};
  S.dirty = false;
  S.flash = '';
  renderApp();
}

window.addEventListener('beforeunload', (e) => {
  if (!S.dirty) return;
  e.preventDefault();
  e.returnValue = '';
});

/* ---------------------------------------------------------------- sign in ---------------------------------------------------------------- */

function langSwitch(rerender) {
  return h('div', { class: 'adm-lang', role: 'group', 'aria-label': 'Language / Gjuha' },
    ['en', 'sq'].map((l) => h('button', {
      type: 'button', class: 'adm-lang__btn', lang: l, 'aria-pressed': String(lang() === l),
      onclick: () => { setLang(l); rerender(); }, text: l.toUpperCase(),
    })));
}

function renderLogin(error = '') {
  document.documentElement.lang = T().htmlLang;
  document.title = `${T().title} · Stefano Doko`;
  const pw = h('input', { class: 'adm-input', type: 'password', id: 'pw', name: 'password', autocomplete: 'current-password', required: true, maxlength: '200' });
  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.login(pw.value);
      pw.value = '';
      await enter();
    } catch (err) {
      pw.value = '';
      renderLogin(err.code);
    }
  };
  // the password can be shown while it is typed, and is hidden again on its way out
  const eye = h('button', {
    type: 'button', class: 'adm-word adm-pw__eye', 'aria-controls': 'pw', 'aria-pressed': 'false', text: T().showPassword,
    onclick: () => {
      const show = pw.type === 'password';
      pw.type = show ? 'text' : 'password';
      eye.setAttribute('aria-pressed', String(show));
      eye.textContent = show ? T().hidePassword : T().showPassword;
      pw.focus();
    },
  });
  app.replaceChildren(h('main', { class: 'adm-login' },
    h('p', { class: 'adm-login__mark', text: 'Stefano Doko' }),
    h('h1', { class: 'adm-login__head', text: T().title }),
    langSwitch(() => renderLogin(error)),
    S.me && !S.me.passwordSet ? h('p', { class: 'adm-help', text: T().noPassword }) : null,
    h('form', { class: 'adm-login__form', onsubmit: (e) => { pw.type = 'password'; return submit(e); } },
      h('label', { class: 'adm-label', for: 'pw', text: T().password }),
      h('div', { class: 'adm-pw' }, pw, eye),
      h('button', { class: 'adm-btn adm-btn--ink', type: 'submit', text: T().signIn })),
    S.me?.devLogin
      ? h('button', { class: 'adm-btn adm-btn--line', type: 'button', onclick: async () => { try { await api.devLogin(); await enter(); } catch (err) { renderLogin(err.code); } }, text: T().devSignIn })
      : null,
    h('p', { class: 'adm-err', role: 'alert', text: error ? T().errors[error] || T().errors.server : '' })));
  pw.focus();
}

async function enter() {
  S.me = await api.me();
  if (!S.me.admin) return renderLogin();
  take(await api.settings());
  S.panel = panelFromHash();
  renderApp();
}

/* ----------------------------------------------------------------- frame ----------------------------------------------------------------- */

const panelFromHash = () => {
  const p = location.hash.slice(1);
  return PANELS.includes(p) ? p : 'overview';
};

window.addEventListener('hashchange', () => {
  if (!S.saved || !S.me?.admin) return;
  S.panel = panelFromHash();
  if (S.panel !== 'telegrams') S.inbox.open = null;
  renderApp();
  app.querySelector('.adm-h1')?.focus();
});

function topBar() {
  return h('header', { class: 'adm-top' },
    h('a', { class: 'adm-lockup', href: '#overview' }, h('b', { text: 'Stefano Doko' }), h('span', { text: T().title })),
    h('div', { class: 'adm-top__end' },
      langSwitch(renderApp),
      h('a', { class: 'adm-word', href: '/', target: '_blank', rel: 'noopener', text: `${T().viewSite} ↗` }),
      h('button', {
        type: 'button', class: 'adm-word', text: T().signOut,
        onclick: async () => {
          if (S.dirty && !window.confirm(T().save.dirty)) return;
          S.dirty = false;
          try { await api.logout(); } catch { /* the cookie is dropped either way */ }
          signedOut();
        },
      })));
}

function navBar() {
  return h('nav', { class: 'adm-nav', 'aria-label': T().title },
    h('ul', {}, PANELS.map((p) => h('li', {},
      h('a', { class: 'adm-nav__link', href: `#${p}`, 'aria-current': S.panel === p ? 'page' : null },
        T().nav[p],
        p === 'telegrams' ? h('span', { class: 'adm-badge', 'data-unread': '', hidden: !S.unread, text: S.unread ? String(S.unread) : '' }) : null)))));
}

function saveBar() {
  return h('div', { class: 'adm-savebar', 'data-savebar': '', hidden: true },
    h('p', { class: 'adm-savebar__msg', 'data-savemsg': '', role: 'status' }),
    h('div', { class: 'adm-savebar__actions' },
      h('button', { type: 'button', class: 'adm-btn adm-btn--line', 'data-discard': '', onclick: discard, text: T().save.discard }),
      h('button', { type: 'button', class: 'adm-btn adm-btn--ink', 'data-save': '', onclick: save, text: T().save.button })));
}

function renderApp() {
  document.documentElement.lang = T().htmlLang;
  document.title = `${T().nav[S.panel]} · ${T().title} · Stefano Doko`;
  const panels = { overview, contact, rates, portrait, graphic, quotes, greta, visits, telegrams };
  app.replaceChildren(topBar(), h('div', { class: 'adm-body' }, navBar(), h('main', { class: 'adm-main', id: 'main' }, panels[S.panel]())), saveBar());
  refreshChrome();
  // on a phone the sections are a strip that scrolls sideways: the open one is brought into it
  const cur = app.querySelector('.adm-nav__link[aria-current="page"]');
  const strip = cur?.closest('ul');
  if (strip && strip.scrollWidth > strip.clientWidth) {
    strip.scrollLeft += cur.getBoundingClientRect().left - strip.getBoundingClientRect().left - (strip.clientWidth - cur.offsetWidth) / 2;
  }
}

/* --------------------------------------------------------------- sections ---------------------------------------------------------------- */

function overview() {
  const O = T().overview;
  const emailOk = EMAIL_RE.test(S.draft.email);
  const check = (ok, text, href) => h('li', { class: `adm-check adm-check--${ok ? 'ok' : 'todo'}` },
    h('span', { class: 'adm-check__mark', 'aria-hidden': 'true', text: ok ? '✓' : '✗' }),
    href ? h('a', { href, class: 'adm-check__text', text }) : h('span', { class: 'adm-check__text', text }));
  return h('section', {},
    h1(O.head),
    h('section', { class: 'adm-card', 'aria-labelledby': 'launch-h' },
      h('h2', { class: 'adm-h2', id: 'launch-h', text: O.launch }),
      h('ul', { class: 'adm-checks' },
        check(emailOk, emailOk ? fill(O.emailSet, { email: S.draft.email }) : O.emailMissing, '#contact'),
        check(S.me?.passwordSet, S.me?.passwordSet ? O.passwordSet : O.passwordMissing),
        check(!S.unread, S.unread ? fill(O.unread, { n: S.unread }) : O.noUnread, '#telegrams'))),
    h('section', { 'aria-labelledby': 'parts-h' },
      h('h2', { class: 'adm-h2', id: 'parts-h', text: O.parts }),
      h('p', { class: 'adm-help', text: O.partsNote }),
      h('p', { class: 'adm-help', text: O.langsNote }),
      h('ul', { class: 'adm-parts' }, FEATURES.map((f) => h('li', { class: 'adm-part' },
        h('div', { class: 'adm-part__text' },
          h('h3', { class: 'adm-part__name', text: T().features[f][0] }),
          h('p', { class: 'adm-help', text: T().features[f][1] })),
        chip(f),
        toggle(f),
        PANEL_OF[f] ? h('a', { class: 'adm-word', href: `#${PANEL_OF[f]}`, text: T().edit }) : h('span', { 'aria-hidden': 'true' }))))));
}

function contact() {
  const C = T().contact;
  const d = S.draft;
  const shown = d.whatsapp && /^\d+$/.test(d.whatsapp) ? `+${d.whatsapp}` : d.whatsapp;
  const test = h('a', { class: 'adm-word', target: '_blank', rel: 'noopener', 'data-wa-test': '', text: `${C.test} ↗` });
  const paintTest = () => {
    const n = digits(d.whatsapp);
    test.hidden = !/^\d{8,15}$/.test(n);
    test.href = `https://wa.me/${n}`;
  };
  paintTest();
  return h('section', {},
    h1(C.head),
    field({ id: 'email', label: C.email, helpText: C.emailHelp, path: 'email', control: input(d.email, (v) => { d.email = v; }, { type: 'email', autocomplete: 'email', maxlength: String(LIMITS.email), spellcheck: 'false' }) }),
    featureLine('whatsapp'),
    field({ id: 'whatsapp', label: C.whatsapp, helpText: C.whatsappHelp, path: 'whatsapp', control: input(shown, (v) => { d.whatsapp = v; paintTest(); }, { type: 'tel', inputmode: 'tel', autocomplete: 'tel', maxlength: '24' }) }),
    test,
    featureLine('availability'),
    // a month picker where the browser has one; elsewhere the same field takes "2026-10"
    field({ id: 'availability', label: C.availability, helpText: C.availabilityHelp, path: 'availability.from', control: input(d.availability.from, (v) => { d.availability.from = v; }, { type: 'month', placeholder: '2026-10', maxlength: '7' }) }),
    featureLine('links'),
    h('p', { class: 'adm-help', text: C.linksHelp }),
    Object.keys(LINKS).map((k) => field({
      id: `link-${k}`, label: LINK_NAMES[k], path: `links.${k}`,
      control: input(d.links[k], (v) => { d.links[k] = v; }, { inputmode: 'url', maxlength: String(LIMITS.url), spellcheck: 'false', autocomplete: 'off', placeholder: k === 'instagram' ? '@stefanodoko' : 'https://' }),
    })),
    featureLine('vcard'),
    h('p', { class: 'adm-help', text: C.vcardHelp }),
    isEmail(d.email)
      ? h('button', { type: 'button', class: 'adm-btn adm-btn--line', onclick: downloadQr, text: C.qr })
      : h('p', { class: 'adm-help', text: C.qrNeeds }));
}

/** The contact card's QR code as an SVG file, for the business card and the flyer. */
async function downloadQr() {
  const st = draftStatus();
  const text = vcard({ email: S.draft.email, phone: st.whatsapp.live ? digits(S.draft.whatsapp) : '', url: `${location.origin}/`, lang: lang() });
  const blob = new Blob([await qrFile(text)], { type: 'image/svg+xml' });
  const a = h('a', { href: URL.createObjectURL(blob), download: 'stefano-doko-qr.svg' });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function rates() {
  const R = T().rates;
  const r = S.draft.rates;
  const list = h('div', { class: 'adm-list' });
  // where the rate stands on the card: in no group (the top), or under one of the card's heads
  const groupSelect = (it) => h('select', { class: 'adm-input adm-input--select', onchange: (e) => { it.group = e.target.value; changed(); } },
    ['', ...RATE_GROUPS].map((g) => h('option', { value: g, selected: (it.group || '') === g ? true : null, text: R.groups[g || 'none'] })));
  const paint = () => {
    list.replaceChildren(...(r.items.length ? r.items.map((it, i) => {
      if (!it.unit) it.unit = blankLangs();
      return h('fieldset', { class: 'adm-item' },
        h('legend', { class: 'adm-item__head', text: fill(R.item, { n: i + 1 }) }),
        pair({ id: `rate-${it.id}-name`, label: R.name, obj: it.name, max: LIMITS.itemName, path: `rates.items.${i}.name` }),
        pair({ id: `rate-${it.id}-desc`, label: R.desc, obj: it.desc, max: LIMITS.itemDesc }),
        h('div', { class: 'adm-item__row' },
          field({ id: `rate-${it.id}-group`, label: R.group, control: groupSelect(it) }),
          field({ id: `rate-${it.id}-price`, label: `${R.price} (${r.currency})`, path: `rates.items.${i}.price`, control: input(it.price === 0 && !it.name.en && !it.name.sq ? '' : String(it.price ?? ''), (v) => { it.price = v; }, { inputmode: 'numeric', maxlength: '14' }) }),
          h('label', { class: 'adm-check-input' },
            h('input', { type: 'checkbox', checked: it.from === true, onchange: (e) => { it.from = e.target.checked; changed(); } }),
            h('span', { text: R.from }))),
        pair({ id: `rate-${it.id}-unit`, label: R.unit, obj: it.unit, max: LIMITS.unit, helpText: R.unitHelp }),
        listButtons(r.items, i, paint));
    }) : [h('p', { class: 'adm-help', text: R.empty })]));
    add.disabled = r.items.length >= LIMITS.rates;
    add.title = add.disabled ? fill(R.max, { n: LIMITS.rates }) : '';
    menu.hidden = r.items.length > 0;
    refreshChrome();
  };
  const add = h('button', {
    type: 'button', class: 'adm-btn adm-btn--line',
    // a new rate goes in the group of the one before it, so a group is typed in a row
    onclick: () => { r.items.push({ id: newId(), name: blankLangs(), desc: blankLangs(), unit: blankLangs(), price: '', from: false, group: r.items.at(-1)?.group || '' }); changed(); paint(); list.lastElementChild?.querySelector('input')?.focus(); },
    text: R.add,
  });
  const currency = h('select', { class: 'adm-input adm-input--select', onchange: (e) => { r.currency = e.target.value; changed(); paint(); } },
    CURRENCIES.map((c) => h('option', { value: c, selected: r.currency === c ? true : null, text: c })));
  // an empty card can take the flyer's menu as a draft, to read through and save
  const menu = h('div', { class: 'adm-field' },
    h('button', {
      type: 'button', class: 'adm-btn adm-btn--line', 'aria-describedby': 'rates-menu-help',
      onclick: () => {
        r.items = MENU.map((it) => ({ id: newId(), ...copy(it) }));
        r.currency = MENU_CURRENCY;
        currency.value = MENU_CURRENCY;
        changed(); paint(); list.querySelector('input')?.focus();
      },
      text: R.fillMenu,
    }),
    help('rates-menu-help', R.fillMenuHelp));
  paint();
  return h('section', {},
    h1(R.head),
    featureLine('rates'),
    featureLine('calculator'),
    field({ id: 'currency', label: R.currency, control: currency }),
    pair({ id: 'rates-note', label: R.note, obj: r.note, max: LIMITS.note, helpText: R.noteHelp }),
    list,
    menu,
    add);
}

function portrait() {
  const P = T().portrait;
  const p = S.draft.portrait;
  const state = h('p', { class: 'adm-help', role: 'status', text: S.photo === 'uploading' ? P.uploading : S.photo === 'uploaded' ? P.uploaded : S.photo ? T().errors[S.photo] || T().errors.server : '' });
  const file = h('input', { type: 'file', id: 'photo', accept: 'image/jpeg,image/png,image/webp', class: 'adm-file' });
  file.addEventListener('change', async () => {
    const f = file.files?.[0];
    if (!f) return;
    S.photo = 'uploading';
    renderApp();
    try {
      const { blob, w, h: height } = await resizePhoto(f);
      const data = await api.uploadPortrait(blob, w, height);
      // the photo is kept at once; the rest of the draft stays as it is
      S.saved = data.settings;
      Object.assign(S.draft.portrait, { key: data.settings.portrait.key, w: data.settings.portrait.w, h: data.settings.portrait.h });
      S.photo = 'uploaded';
    } catch (e) {
      if (fail(e)) return;
      S.photo = e.code || e.message || 'server';
    }
    renderApp();
  });
  const remove = async () => {
    // the photo goes at once, not with Save: asked first
    if (!(await confirmBox({ text: P.confirmRemove, yes: P.confirmYes, no: P.confirmNo }))) return;
    try {
      const data = await api.removePortrait();
      S.saved = data.settings;
      Object.assign(S.draft.portrait, { key: '', w: 0, h: 0 });
      S.photo = '';
    } catch (e) {
      if (fail(e)) return;
      S.photo = e.code || 'server';
    }
    renderApp();
  };
  return h('section', {},
    h1(P.head),
    featureLine('portrait'),
    h('div', { class: 'adm-photo' },
      p.key ? h('img', { class: 'adm-photo__img', src: `/${p.key}`, alt: '', width: String(p.w), height: String(p.h) }) : h('p', { class: 'adm-photo__none', text: P.none }),
      h('div', { class: 'adm-photo__actions' },
        h('label', { class: 'adm-btn adm-btn--line', for: 'photo', text: p.key ? P.replace : P.choose }),
        file,
        p.key ? h('button', { type: 'button', class: 'adm-word adm-word--danger', onclick: remove, text: P.remove }) : null,
        state,
        h('p', { class: 'adm-help', text: P.help }))),
    pair({ id: 'caption', label: P.caption, obj: p.caption, max: LIMITS.caption }));
}

function graphic() {
  const G = T().graphic;
  const pieces = S.draft.graphic;
  const busy = S.piece.state === 'uploading';
  const said = S.piece.state === 'uploading' ? G.uploading : S.piece.state === 'uploaded' ? G.uploaded : S.piece.state ? T().errors[S.piece.state] || T().errors.server : '';

  // a photo, chosen: kept at once, as a new piece or in place of a piece's photo
  const send = async (file, id) => {
    S.piece = { state: 'uploading', id };
    renderApp();
    try {
      const { blob, w, h: height } = await resizePhoto(file, 1800);
      const data = id ? await api.replacePiece(id, blob, w, height) : await api.addPiece(blob, w, height);
      S.saved = data.settings;
      const stored = data.settings.graphic.find((g) => g.id === (id || data.piece));
      const mine = pieces.find((g) => g.id === stored?.id);
      if (mine) Object.assign(mine, { key: stored.key, w: stored.w, h: stored.h });
      else if (stored) pieces.push(copy(stored));
      S.piece = { state: 'uploaded', id: stored?.id || '' };
    } catch (e) {
      if (fail(e)) return;
      S.piece = { state: e.code || e.message || 'server', id };
    }
    renderApp();
  };
  const chooser = (inputId, id) => {
    const file = h('input', { type: 'file', id: inputId, accept: 'image/jpeg,image/png,image/webp', class: 'adm-file', disabled: busy });
    file.addEventListener('change', () => { const f = file.files?.[0]; if (f) send(f, id); });
    return file;
  };

  const list = h('div', { class: 'adm-list' });
  const paint = () => {
    list.replaceChildren(...(pieces.length ? pieces.map((g, i) => h('fieldset', { class: 'adm-item' },
      h('legend', { class: 'adm-item__head', text: fill(G.item, { n: i + 1 }) }),
      h('div', { class: 'adm-photo' },
        h('img', { class: 'adm-photo__img', src: `/${g.key}`, alt: '', width: String(g.w), height: String(g.h) }),
        h('div', { class: 'adm-photo__actions' },
          h('label', { class: 'adm-btn adm-btn--line', for: `piece-${g.id}-photo`, text: G.replace }),
          chooser(`piece-${g.id}-photo`, g.id),
          S.piece.id === g.id && said ? h('p', { class: 'adm-help', role: 'status', text: said }) : null)),
      pair({ id: `piece-${g.id}-title`, label: G.title, obj: g.title, max: LIMITS.title }),
      h('div', { class: 'adm-item__row' },
        field({ id: `piece-${g.id}-client`, label: G.client, control: input(g.client, (v) => { g.client = v; }, { maxlength: String(LIMITS.client) }) }),
        field({ id: `piece-${g.id}-year`, label: G.year, path: `graphic.${i}.year`, control: input(g.year, (v) => { g.year = v; }, { inputmode: 'numeric', maxlength: '4', placeholder: '2025' }) })),
      h('label', { class: 'adm-check-input adm-check-input--strong' },
        h('input', { type: 'checkbox', checked: g.permission === true, onchange: (e) => { g.permission = e.target.checked; changed(); } }),
        h('span', { text: G.permission })),
      listButtons(pieces, i, paint))) : [h('p', { class: 'adm-help', text: G.empty })]));
    refreshChrome();
  };
  paint();
  const full = pieces.length >= LIMITS.graphic;
  return h('section', {},
    h1(G.head),
    featureLine('graphic'),
    h('p', { class: 'adm-help', text: G.help }),
    list,
    h('div', { class: 'adm-photo__actions' },
      h('label', { class: `adm-btn adm-btn--line${full || busy ? ' is-disabled' : ''}`, for: 'piece-new', 'aria-disabled': full || busy ? 'true' : null, text: G.add }),
      full ? null : chooser('piece-new', ''),
      full ? h('p', { class: 'adm-help', text: G.max }) : null,
      !S.piece.id && said ? h('p', { class: 'adm-help', role: 'status', text: said }) : null));
}

function visits() {
  const V = T().visits;
  return h('section', {},
    h1(V.head),
    featureLine('analytics'),
    field({ id: 'cf-token', label: V.token, helpText: V.tokenHelp, path: 'analytics.token', control: input(S.draft.analytics.token, (v) => { S.draft.analytics.token = v; }, { maxlength: '64', spellcheck: 'false', autocomplete: 'off' }) }));
}

function quotes() {
  const Q = T().quotes;
  const qs = S.draft.quotes;
  const list = h('div', { class: 'adm-list' });
  const paint = () => {
    list.replaceChildren(...(qs.length ? qs.map((q, i) => {
      const other = q.lang === 'sq' ? 'en' : 'sq';
      return h('fieldset', { class: 'adm-item' },
        h('legend', { class: 'adm-item__head', text: fill(Q.item, { n: i + 1 }) }),
        field({ id: `q-${q.id}-text`, label: Q.text, path: `quotes.${i}.text`, control: area(q.text, (v) => { q.text = v; }, { maxlength: String(LIMITS.quote), lang: q.lang }) }),
        h('fieldset', { class: 'adm-radios' },
          h('legend', { class: 'adm-label', text: Q.lang }),
          ['sq', 'en'].map((l) => h('label', { class: 'adm-check-input' },
            h('input', { type: 'radio', name: `q-${q.id}-lang`, value: l, checked: q.lang === l, onchange: () => { q.lang = l; changed(); paint(); } }),
            h('span', { text: T().langName[l] })))),
        field({ id: `q-${q.id}-tr`, label: fill(Q.translation, { lang: T().langName[other] }), control: area(q.translation, (v) => { q.translation = v; }, { maxlength: String(LIMITS.quote), lang: other }) }),
        h('div', { class: 'adm-item__row' },
          field({ id: `q-${q.id}-name`, label: Q.name, path: `quotes.${i}.name`, control: input(q.name, (v) => { q.name = v; }, { maxlength: String(LIMITS.person) }) }),
          field({ id: `q-${q.id}-biz`, label: Q.business, control: input(q.business, (v) => { q.business = v; }, { maxlength: String(LIMITS.business) }) })),
        h('label', { class: 'adm-check-input adm-check-input--strong' },
          h('input', { type: 'checkbox', checked: q.permission === true, onchange: (e) => { q.permission = e.target.checked; changed(); } }),
          h('span', { text: Q.permission })),
        listButtons(qs, i, paint));
    }) : [h('p', { class: 'adm-help', text: Q.empty })]));
    add.disabled = qs.length >= LIMITS.quotes;
    refreshChrome();
  };
  const add = h('button', {
    type: 'button', class: 'adm-btn adm-btn--line',
    onclick: () => { qs.push({ id: newId(), text: '', lang: 'sq', translation: '', name: '', business: '', permission: false }); changed(); paint(); list.lastElementChild?.querySelector('textarea')?.focus(); },
    text: Q.add,
  });
  paint();
  return h('section', {}, h1(Q.head), featureLine('quotes'), h('p', { class: 'adm-help', text: Q.help }), list, add);
}

function greta() {
  const G = T().greta;
  return h('section', {},
    h1(G.head),
    featureLine('greta'),
    field({ id: 'greta-url', label: G.url, helpText: G.urlHelp, path: 'greta.url', control: input(S.draft.greta.url, (v) => { S.draft.greta.url = v; }, { type: 'url', inputmode: 'url', maxlength: String(LIMITS.url), spellcheck: 'false', placeholder: 'https://' }) }));
}

/* ---------------------------------------------------------------- inbox ----------------------------------------------------------------- */

/**
 * A question that must be answered before something is undone for good: a
 * modal dialog (the page behind it inert, Escape or "keep" to say no), focus
 * on the safe answer. Resolves true for yes.
 */
function confirmBox({ text, yes, no }) {
  return new Promise((resolve) => {
    const dlg = h('dialog', { class: 'adm-dialog', 'aria-labelledby': 'adm-dialog-q' });
    const done = (answer) => { dlg.close(); dlg.remove(); resolve(answer); };
    const keep = h('button', { type: 'button', class: 'adm-btn adm-btn--line', onclick: () => done(false), text: no });
    dlg.append(
      h('p', { class: 'adm-dialog__q', id: 'adm-dialog-q', text }),
      h('div', { class: 'adm-dialog__actions' },
        h('button', { type: 'button', class: 'adm-btn adm-btn--danger', onclick: () => done(true), text: yes }),
        keep));
    dlg.addEventListener('cancel', (e) => { e.preventDefault(); done(false); });
    document.body.append(dlg);
    dlg.showModal();
    keep.focus();
  });
}

async function loadInbox(more = false) {
  S.inbox.busy = true;
  try {
    const data = await api.telegrams(more ? S.inbox.cursor : '');
    S.inbox.items = more ? S.inbox.items.concat(data.items) : data.items;
    S.inbox.cursor = data.cursor;
    S.inbox.loaded = true;
    // the form's numbers, beside the list (an older Worker without them: nothing shown)
    if (!more) S.inbox.stats = await api.stats().catch(() => null);
  } catch (e) {
    if (fail(e)) return;
  } finally {
    S.inbox.busy = false;
  }
  if (S.panel === 'telegrams') renderApp();
}

async function openTelegram(key) {
  try {
    let t = await api.telegram(key);
    if (!t.read) {
      t = await api.markRead(key, true);
      S.unread = Math.max(0, S.unread - 1);
      const row = S.inbox.items.find((x) => x.key === key);
      if (row) row.read = true;
    }
    S.inbox.open = t;
    S.inbox.confirm = false;
  } catch (e) {
    if (fail(e)) return;
  }
  renderApp();
  app.querySelector('.adm-letter')?.focus();
}

function replyLink(reply) {
  if (EMAIL_RE.test(reply)) return h('a', { href: `mailto:${reply}`, text: reply });
  const n = digits(reply);
  if (n.length >= 7) return h('span', {}, h('a', { href: `tel:+${n}`, text: reply }), ' · ', h('a', { href: `https://wa.me/${n}`, target: '_blank', rel: 'noopener', text: 'WhatsApp ↗' }));
  return reply;
}

function telegrams() {
  const M = T().telegrams;
  if (!S.inbox.loaded && !S.inbox.busy) loadInbox();
  if (S.inbox.open) {
    const t = S.inbox.open;
    const row = (k, v) => [h('dt', { text: k }), h('dd', {}, v)];
    return h('section', {},
      h1(M.head),
      h('button', { type: 'button', class: 'adm-word', onclick: () => { S.inbox.open = null; renderApp(); }, text: `← ${M.close}` }),
      h('article', { class: 'adm-letter', tabindex: '-1' },
        h('dl', { class: 'adm-letter__meta' },
          row(M.from, t.name),
          t.business ? row(M.business, t.business) : null,
          row(M.reply, replyLink(t.reply)),
          row(M.replyIn, T().langName[t.lang] || t.lang),
          row(M.received, when(t.at)),
          t.from ? row(M.cameVia, t.from) : null),
        h('p', { class: 'adm-letter__body', lang: t.lang, text: t.message })),
      h('div', { class: 'adm-row-actions' },
        h('button', {
          type: 'button', class: 'adm-btn adm-btn--line', text: t.read ? M.markUnread : M.markRead,
          onclick: async () => {
            try {
              S.inbox.open = await api.markRead(t.key, !t.read);
              S.unread += S.inbox.open.read ? -1 : 1;
              const r = S.inbox.items.find((x) => x.key === t.key);
              if (r) r.read = S.inbox.open.read;
            } catch (e) { if (fail(e)) return; }
            renderApp();
          },
        }),
        S.inbox.confirm
          ? h('span', { class: 'adm-confirm', role: 'alert' },
            h('span', { text: M.confirmDelete }),
            h('button', {
              type: 'button', class: 'adm-btn adm-btn--danger', text: M.delete,
              onclick: async () => {
                try {
                  await api.deleteTelegram(t.key);
                  if (!t.read) S.unread = Math.max(0, S.unread - 1);
                  S.inbox.items = S.inbox.items.filter((x) => x.key !== t.key);
                  S.inbox.open = null;
                } catch (e) { if (fail(e)) return; }
                S.inbox.confirm = false;
                renderApp();
              },
            }),
            h('button', { type: 'button', class: 'adm-word', onclick: () => { S.inbox.confirm = false; renderApp(); }, text: M.keep }))
          : h('button', { type: 'button', class: 'adm-word adm-word--danger', onclick: () => { S.inbox.confirm = true; renderApp(); }, text: M.delete })));
  }
  const items = S.inbox.items;
  // telegrams begun against telegrams sent: how well the form does
  const st = S.inbox.stats;
  const [now, before] = st?.months || [];
  const statsLine = !st ? null : !st.counting && !(now?.started || now?.sent)
    ? h('p', { class: 'adm-help', text: M.statsOff })
    : h('p', { class: 'adm-help adm-stats', text: fill(M.stats, {
      started: now?.started ?? 0, sent: now?.sent ?? 0,
      rate: now?.started ? fill(M.statsRate, { pct: Math.min(100, Math.round((now.sent / now.started) * 100)) }) : '',
      pstarted: before?.started ?? 0, psent: before?.sent ?? 0,
    }) });
  return h('section', {},
    h1(M.head),
    statsLine,
    S.inbox.loaded && !items.length ? h('p', { class: 'adm-help', text: M.empty }) : null,
    h('ul', { class: 'adm-inbox' }, items.map((t) => h('li', {},
      h('button', { type: 'button', class: `adm-inbox__row${t.read ? '' : ' is-unread'}`, onclick: () => openTelegram(t.key) },
        h('span', { class: 'adm-inbox__who' }, t.read ? null : h('span', { class: 'adm-chip adm-chip--live', text: M.unread }), h('b', { text: t.name }), t.business ? h('span', { text: ` · ${t.business}` }) : null),
        h('span', { class: 'adm-inbox__when', text: when(t.at) }),
        h('span', { class: 'adm-inbox__preview', text: t.preview }))))),
    S.inbox.cursor ? h('button', { type: 'button', class: 'adm-btn adm-btn--line', onclick: () => loadInbox(true), text: M.more }) : null);
}

/* ----------------------------------------------------------------- start ----------------------------------------------------------------- */

(async function start() {
  try {
    S.me = await api.me();
  } catch {
    // no Worker behind this page (a plain static preview): say how to start one
    app.replaceChildren(h('main', { class: 'adm-login' },
      h('p', { class: 'adm-login__mark', text: 'Stefano Doko' }),
      h('h1', { class: 'adm-login__head', text: T().title }),
      h('p', { class: 'adm-help', text: 'The admin panel needs the Worker: npm run worker:dev, then http://127.0.0.1:3672/admin/' })));
    return;
  }
  if (!S.me.admin) return renderLogin();
  try {
    await enter();
  } catch (e) {
    if (!fail(e)) renderLogin(e.code);
  }
})();
