// Checks the Worker end to end against a running `npm run worker:dev`
// (http://127.0.0.1:3672): sign-in and its locks, saving and checking
// settings, what a page receives, the portrait, and the telegram inbox. It
// keeps the settings it finds and puts them back at the end, and deletes the
// telegrams it sent, so local data is left as it was.
// usage: node tools/test-admin.mjs [base-url]
const BASE = process.argv[2] || 'http://127.0.0.1:3672';
const ORIGIN = new URL(BASE).origin;
let cookie = '';
let failures = 0;
let passes = 0;

function check(ok, label, detail = '') {
  if (ok) { passes++; console.log(`  ok   ${label}`); } else { failures++; console.log(`  FAIL ${label}${detail ? `: ${detail}` : ''}`); }
}

async function req(method, path, { body, origin = true, form, raw } = {}) {
  const headers = {};
  if (origin) headers.origin = ORIGIN;
  if (cookie) headers.cookie = cookie;
  let payload;
  if (form) payload = form;
  else if (raw !== undefined) { payload = raw; headers['content-type'] = 'application/x-www-form-urlencoded'; }
  else if (body !== undefined) { payload = JSON.stringify(body); headers['content-type'] = 'application/json'; }
  const res = await fetch(`${BASE}${path}`, { method, headers, body: payload, redirect: 'manual' });
  const set = res.headers.get('set-cookie');
  if (set) cookie = set.split(';')[0].endsWith('=') ? '' : set.split(';')[0];
  const type = res.headers.get('content-type') || '';
  const data = type.includes('json') ? await res.json() : await res.text();
  return { status: res.status, data, headers: res.headers };
}

const page = async (path) => (await fetch(`${BASE}${path}`)).text();
const settingsIn = (html) => JSON.parse(html.match(/<script type="application\/json" id="site-settings">(.*?)<\/script>/s)[1]);

// If a step throws halfway (a telegram refused by the hourly limit, a Worker
// still serving an older build), the settings and the form's numbers found at
// the start still go back, and the test telegram goes, before the run stops:
// test data never stays behind.
const kept = {};
process.on('uncaughtException', async (err) => {
  console.error(err);
  if (kept.settings) await req('PUT', '/api/admin/settings', { body: kept.settings }).catch(() => {});
  if (kept.stats) await req('PUT', '/api/admin/stats', { body: { months: kept.stats.months } }).catch(() => {});
  const list = await req('GET', '/api/admin/telegrams').catch(() => null);
  for (const t of list?.data?.items || []) if (t.name === 'Test Sender') await req('DELETE', `/api/admin/telegrams/${encodeURIComponent(t.key)}`).catch(() => {});
  console.log(`\nstopped after ${passes} passed, ${failures} failed; ${kept.settings ? 'the settings and numbers found at the start were put back' : 'nothing had been changed yet'}`);
  process.exit(1);
});

console.log(`Worker at ${BASE}`);

// ---- locks
let r = await req('GET', '/api/admin/me', { origin: false });
check(r.status === 200 && r.data.admin === false, 'signed out at first');
check(r.data.devLogin === true, 'the local sign-in is offered on localhost');
r = await req('PUT', '/api/admin/settings', { body: {} });
check(r.status === 401, 'saving without a session is refused', r.status);
r = await req('POST', '/api/admin/dev-login', { origin: false });
check(r.status === 403, 'sign-in without an Origin header is refused', r.status);
r = await req('POST', '/api/admin/dev-login');
check(r.status === 200 && cookie.startsWith('sd_admin='), 'local sign-in gives a session cookie');
r = await req('GET', '/api/admin/me');
check(r.data.admin === true, 'the session is recognised');
r = await req('PUT', '/api/admin/settings', { body: {}, origin: false });
check(r.status === 403, 'a change without Origin is refused even when signed in', r.status);

// ---- keep what is there
r = await req('GET', '/api/admin/settings');
check(r.status === 200 && r.data.settings && r.data.status, 'settings load');
const before = r.data.settings;
kept.settings = before;

// ---- checks on saving
r = await req('PUT', '/api/admin/settings', {
  body: {
    email: 'not an address', whatsapp: '12', greta: { url: 'http://insecure.example' }, availability: { from: '2026-13' },
    rates: { items: [{ name: { en: 'Logo', sq: '' }, price: 'abc' }] },
    quotes: [{ text: 'Good work', name: '' }],
  },
});
check(r.status === 400, 'bad input is refused', r.status);
const e = r.data.errors || {};
check(e.email === 'email' && e.whatsapp === 'whatsapp' && e['greta.url'] === 'url', 'email, number and link are each named', JSON.stringify(e));
check(e['rates.items.0.price'] === 'price' && e['quotes.0.name'] === 'required', 'the rate and the quote are each named', JSON.stringify(e));
check(e['availability.from'] === 'month', 'a month that does not exist is refused', JSON.stringify(e));

// ---- a full save
const trap = '</script><script>alert(1)</script>';
r = await req('PUT', '/api/admin/settings', {
  body: {
    email: 'test@stefano-doko.invalid.test',
    whatsapp: '+355 69 000 0000',
    availability: { from: '2099-10' },
    features: { whatsapp: true, availability: true, rates: true, portrait: true, quotes: true, greta: true, print: true, masthead: true, magnifier: true },
    rates: {
      currency: 'ALL', note: { en: 'Test note', sq: 'Shënim prove' },
      items: [
        { name: { en: 'Test rate', sq: 'Çmim prove' }, desc: { en: 'A test', sq: 'Një provë' }, price: '12 000', from: true, best: true, group: 'extras', unit: { en: '  photo ', sq: 'foto' } },
        { name: { en: '', sq: '' }, desc: { en: '', sq: '' }, price: '' },
      ],
    },
    quotes: [
      { text: `Test quote ${trap}`, lang: 'en', translation: '', name: 'Test Person', business: 'Test Co', permission: true },
      { text: 'Not allowed', lang: 'sq', name: 'Someone', business: '', permission: false },
    ],
    greta: { url: 'greta.example.com' },
    portrait: { key: 'media/portrait-hackhack.jpg', caption: { en: 'Test caption', sq: 'Mbishkrim prove' } },
  },
});
check(r.status === 200, 'a full save is kept', JSON.stringify(r.data).slice(0, 200));
const saved = r.data.settings || {};
check(saved.whatsapp === '355690000000', 'the number is stored as digits', saved.whatsapp);
check(saved.rates?.items?.length === 1 && saved.rates.items[0].price === 12000, 'the blank rate row is dropped, the price read as 12000');
check(saved.rates?.items?.[0]?.group === 'extras' && saved.rates.items[0].unit?.en === 'photo' && saved.rates.items[0].unit?.sq === 'foto', 'a rate keeps its group and its unit, trimmed', JSON.stringify(saved.rates?.items?.[0]));
check(saved.rates?.items?.[0]?.best === true, 'a rate keeps its tick as a best option');
check(saved.greta?.url === 'https://greta.example.com/', 'the link is made https', saved.greta?.url);
check(saved.portrait?.key === before.portrait.key, 'a portrait file cannot be set by a save');
const st = r.data.status || {};
check(st.whatsapp?.live && st.availability?.live && st.rates?.live && st.quotes?.live && st.greta?.live && st.print?.live, 'the parts with what they need are live');
check(st.portrait?.on && !st.portrait?.live && st.portrait.needs.includes('photo'), 'the portrait is on but waits for a photo');

// ---- what a page receives
let html = await page('/');
let pub = settingsIn(html);
check(pub.email === 'test@stefano-doko.invalid.test', 'the page carries the email');
check(!html.includes('mailto:hello@example.invalid') && !/>\s*hello@example\.invalid\s*</.test(html), 'no placeholder is left in the page');
check(/<html[^>]*data-features="[^"]*rates[^"]*"/.test(html) && !/data-features="[^"]*portrait/.test(html), 'the html element names what is live, not the portrait');
check(pub.quotes.length === 1 && pub.quotes[0].name === 'Test Person', 'only the quote with permission reaches the page');
check(pub.rates?.items?.[0]?.best === true && html.includes('data-best'), 'the front page knows the best options, and has their place');
check(!html.includes(trap) && html.includes('\\u003c/script>'), 'a quote cannot close the settings script');
check(pub.greta?.host === 'greta.example.com', 'the page knows the link and its host');
check(pub.availability?.from === '2099-10', 'the page knows the month of availability', JSON.stringify(pub.availability));
const lds = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => JSON.parse(m[1]));
check(lds.some((l) => l['@graph']?.some((n) => n['@type'] === 'ProfilePage')), 'the front page carries its structured data (ProfilePage)');
check(lds.some((l) => l['@type'] === 'Person' && l['@id'] === '/#stefano' && l.email === 'test@stefano-doko.invalid.test' && l.telephone === '+355690000000'), 'the Person gets the email and the number once they are live');
html = await page('/sq/kontakt/');
check(settingsIn(html).email === 'test@stefano-doko.invalid.test', 'the Albanian contact page carries it too');
html = await page('/sq/puna/elixir/');
const caseGraph = JSON.parse(html.match(/<script type="application\/ld\+json">(\{"@context":"https:\/\/schema.org","@graph".*?)<\/script>/s)[1])['@graph'];
check(caseGraph.some((n) => n['@type'] === 'WebSite' && n.url === 'https://elixir.al/') && caseGraph.some((n) => n['@type'] === 'BreadcrumbList' && n.itemListElement[0].item.endsWith('/sq/')), 'a case sheet names the live site it is about, with a trail in its own language');

// ---- portrait
const jpeg = new Uint8Array(2048); jpeg.set([0xff, 0xd8, 0xff, 0xe0]);
let form = new FormData();
form.append('file', new File([jpeg], 'p.jpg', { type: 'image/jpeg' }));
form.append('w', '800'); form.append('h', '1000');
r = await req('POST', '/api/admin/portrait', { form });
check(r.status === 200 && /^media\/portrait-[a-z0-9]+\.jpg$/.test(r.data.settings?.portrait?.key || ''), 'a photo upload is kept', r.status);
const key = r.data.settings?.portrait?.key;
check(r.data.status?.portrait?.live === true, 'with a photo the portrait goes live');
const media = await fetch(`${BASE}/${key}`);
check(media.status === 200 && media.headers.get('content-type') === 'image/jpeg' && (media.headers.get('cache-control') || '').includes('immutable'), 'the photo is served with a long cache', `${media.status} ${media.headers.get('content-type')}`);
form = new FormData();
form.append('file', new File([new TextEncoder().encode('<html><script>alert(1)</script></html>')], 'x.jpg', { type: 'image/jpeg' }));
form.append('w', '800'); form.append('h', '1000');
r = await req('POST', '/api/admin/portrait', { form });
check(r.status === 400 && r.data.error === 'not_a_photo', 'a page disguised as a photo is refused', r.status);
r = await req('DELETE', '/api/admin/portrait');
check(r.status === 200 && r.data.settings.portrait.key === '', 'the photo can be removed');
check((await fetch(`${BASE}/${key}`)).status === 404, 'a removed photo is gone');

// ---- profiles, the card, the calculator and the visit counter
const current = r.data.settings;
r = await req('PUT', '/api/admin/settings', { body: { ...current, links: { instagram: 'https://example.com/me' }, analytics: { token: 'not-a-token' } } });
check(r.status === 400 && r.data.errors?.['links.instagram'] === 'profile' && r.data.errors?.['analytics.token'] === 'token', 'a profile on the wrong site and a bad token are each named', JSON.stringify(r.data.errors));
const TOKEN = '0123456789abcdef0123456789abcdef';
r = await req('PUT', '/api/admin/settings', {
  body: {
    ...current,
    features: { ...current.features, links: true, vcard: true, calculator: true, analytics: true },
    links: { instagram: '@test.profile', facebook: '', linkedin: 'https://www.linkedin.com/in/test-profile', behance: '' },
    analytics: { token: TOKEN },
  },
});
check(r.status === 200, 'profiles, the card, the calculator and the counter are kept', r.status);
check(r.data.settings?.links?.instagram === 'https://www.instagram.com/test.profile/', 'an Instagram name becomes its address', r.data.settings?.links?.instagram);
const st2 = r.data.status || {};
check(st2.links?.live && st2.vcard?.live && st2.calculator?.live && st2.analytics?.live, 'the four parts are live');
html = await page('/');
pub = settingsIn(html);
check(pub.links?.length === 2 && pub.links[0].kind === 'instagram', 'the page knows the profiles');
check(pub.counted === true && !html.slice(html.indexOf('id="site-settings"'), html.indexOf('</script>', html.indexOf('id="site-settings"'))).includes(TOKEN), 'the page knows visits are counted, without the token in its settings');
check(html.includes(`data-cf-beacon='{"token":"${TOKEN}"}'`), 'the visit counter’s script is in the page');
check(!(await page('/admin/')).includes('cloudflareinsights'), '...and not in the admin');
const lds2 = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => JSON.parse(m[1]));
check(lds2.some((l) => l['@type'] === 'Person' && l.sameAs?.includes('https://www.instagram.com/test.profile/')), 'the Person lists the profiles');
let vcf = await fetch(`${BASE}/stefano-doko.vcf?lang=sq`);
const card = await vcf.text();
check(vcf.status === 200 && (vcf.headers.get('content-type') || '').startsWith('text/vcard')
  && card.includes('EMAIL:test@stefano-doko.invalid.test') && card.includes('TEL;TYPE=CELL:+355690000000')
  && card.includes('TITLE:Dizajner grafik dhe zhvillues uebi') && /URL:https?:\/\/[^\r\n]+\/sq\//.test(card), 'the card downloads, with the email, the number and the Albanian trade', card.replace(/\r\n/g, ' | ').slice(0, 240));

// ---- graphic work
const upload = () => { const f = new FormData(); f.append('file', new File([jpeg], 'g.jpg', { type: 'image/jpeg' })); f.append('w', '1200'); f.append('h', '900'); return f; };
r = await req('POST', '/api/admin/graphic', { form: upload() });
check(r.status === 200 && r.data.piece && r.data.settings?.graphic?.length === 1, 'a piece of graphic work is kept as soon as its photo is sent', r.status);
const piece = r.data.settings?.graphic?.[0] || {};
check(/^media\/graphic-[a-z0-9]+\.jpg$/.test(piece.key || '') && piece.permission === false && !r.data.status.graphic.live, 'it has its own photo, no permission yet, and does not show');
r = await req('PUT', '/api/admin/settings', {
  body: {
    ...r.data.settings,
    features: { ...r.data.settings.features, graphic: true },
    graphic: [
      { ...piece, key: 'media/graphic-hackhack.jpg', title: { en: 'Test poster', sq: 'Poster prove', it: '' }, client: 'Test Co', year: '2025', permission: true },
      { id: 'madeup12345', key: 'media/graphic-madeup.jpg', title: { en: 'Made up' }, permission: true },
    ],
  },
});
check(r.status === 200 && r.data.settings.graphic.length === 1 && r.data.settings.graphic[0].key === piece.key, 'a save keeps the uploaded photo, and drops a piece that was never uploaded');
check(r.data.status.graphic.live, 'with a title and permission the piece shows');
pub = settingsIn(await page('/it/'));
check(pub.graphic?.length === 1 && pub.graphic[0].src === `/${piece.key}` && pub.graphic[0].title.en === 'Test poster', 'the Italian front page carries it');
html = await page('/sq/puna/');
check(settingsIn(html).graphic?.length === 1 && html.includes('data-graphic'), 'the work’s own page carries it too, where its sheet is');
const gm = await fetch(`${BASE}/${piece.key}`);
check(gm.status === 200 && gm.headers.get('content-type') === 'image/jpeg', 'its photo is served');
r = await req('PUT', '/api/admin/settings', { body: { ...r.data.settings, graphic: [] } });
check(r.status === 200 && r.data.settings.graphic.length === 0 && (await fetch(`${BASE}/${piece.key}`)).status === 404, 'a piece taken off the list takes its photo with it');

// ---- the Italian sheets
html = await page('/it/');
check(/<html lang="it"/.test(html) && html.includes('hreflang="it" href="/it/"') && html.includes('hreflang="sq" href="/sq/"') && html.includes('<meta property="og:locale" content="it_IT">'), 'the Italian front page names itself and its other languages');
html = await page('/it/lavori/elixir/');
const itGraph = JSON.parse(html.match(/<script type="application\/ld\+json">(\{"@context":"https:\/\/schema.org","@graph".*?)<\/script>/s)[1])['@graph'];
check(itGraph.some((n) => n['@type'] === 'BreadcrumbList' && n.itemListElement[0].item.endsWith('/it/')) && itGraph.some((n) => n.inLanguage === 'it'), 'an Italian case sheet has its trail and language');
check(settingsIn(await page('/it/contatti/')).email === 'test@stefano-doko.invalid.test', 'the Italian contact page carries the settings');

// ---- the front page's parts on pages of their own
for (const p of ['/work/', '/sq/rreth/', '/it/servizi/']) {
  const res = await fetch(`${BASE}${p}`);
  html = await res.text();
  check(res.status === 200 && settingsIn(html).email === 'test@stefano-doko.invalid.test' && (html.match(/<h1\b/g) || []).length === 1, `${p} is served with the settings and one head`);
}
html = await page('/it/lavori/elixir/');
check(/"itemListElement":\[\{[^\]]*"item":"\/it\/"\},\{[^\]]*"item":"\/it\/lavori\/"\},\{[^\]]*"item":"\/it\/lavori\/elixir\/"\}\]/.test(html), 'a case sheet’s trail runs through the work');
html = await page('/');
check(!/href="#(work|about|services|elixir|martiri|greta|graphic|contact)"/.test(html) && html.includes('href="/work/" data-route="work" data-spy="#work"'), 'the front page’s words lead to the pages, not down the sheet');

// ---- the engraving's weather: asked of MET Norway by the Worker (without a network there is simply no reading)
r = await req('GET', '/api/weather', { origin: false });
check(r.status === 200 && r.data && (r.data.ok === false || (/^[a-z_]{3,40}$/.test(r.data.code) && (r.data.temp === null || Number.isInteger(r.data.temp)))), 'the weather over Albania is a MET Norway symbol and a temperature, or no reading', JSON.stringify(r.data).slice(0, 120));
check(/max-age=\d+/.test(r.headers.get('cache-control') || ''), 'the weather is kept a while, not asked for on every visit', r.headers.get('cache-control'));

// ---- telegrams
const tg = (fields) => new URLSearchParams({ 'form-name': 'telegram', 'bot-field': '', lang: 'sq', ...fields }).toString();
r = await req('POST', '/api/telegram', { raw: tg({ name: 'Test Sender', business: 'Test Shop', message: 'This is a test telegram.', reply: '+355 69 000 0000' }), origin: false });
check(r.status === 403, 'a telegram from elsewhere is refused', r.status);
r = await req('POST', '/api/telegram', { raw: tg({ name: 'Test Sender', message: 'One', reply: 'x' }) });
check(r.status === 400 && r.data.errors?.message && r.data.errors?.reply, 'a telegram missing its parts is refused, naming them');
// the form's numbers (counted while visits are, as they are now), put back at the end
const statsBefore = (await req('GET', '/api/admin/stats')).data;
kept.stats = statsBefore;
check(statsBefore.counting === true && statsBefore.months?.length === 2, 'the form’s numbers are there, counted while visits are', JSON.stringify(statsBefore));
r = await req('POST', '/api/telegram/started', { raw: '' });
check(r.status === 204, 'a telegram begun is counted', r.status);
r = await req('POST', '/api/telegram/started', { raw: '', origin: false });
check(r.status === 403, 'a count from elsewhere is refused', r.status);
const beforeList = (await req('GET', '/api/admin/telegrams')).data.items.length;
r = await req('POST', '/api/telegram', { raw: tg({ name: 'Bot', message: 'buy cheap things now', reply: 'bot@spam.example', 'bot-field': 'http://spam.example' }) });
check(r.status === 200, 'a bot that fills the hidden line is told all went well');
check((await req('GET', '/api/admin/telegrams')).data.items.length === beforeList, '...and nothing of it is kept');
r = await req('POST', '/api/telegram', { raw: tg({ name: 'Test Sender', business: 'Test Shop', message: 'This is a test telegram.\nSecond line.', reply: '+355 69 000 0000', lang: 'en', from: 'poster / qr<script>' }) });
check(r.status === 200, 'a telegram is received', r.status === 429 ? 'refused by the hourly limit (6 an hour from one address): run again when the hour is up' : r.status);
const statsAfter = (await req('GET', '/api/admin/stats')).data.months[0];
check(statsAfter.started === statsBefore.months[0].started + 1 && statsAfter.sent === statsBefore.months[0].sent + 1, 'this month: one more begun, one more sent', JSON.stringify(statsAfter));
r = await req('GET', '/api/admin/telegrams');
const item = r.data.items.find((t) => t.name === 'Test Sender');
check(item && item.read === false && item.preview.startsWith('This is a test telegram.'), 'it is in the inbox, unread, with a preview');
check((await req('GET', '/api/admin/settings')).data.unread >= 1, 'the unread count includes it');
r = await req('GET', `/api/admin/telegrams/${encodeURIComponent(item.key)}`);
check(r.status === 200 && r.data.message.includes('Second line.') && r.data.lang === 'en', 'the full telegram opens');
check(r.data.from === 'poster / qrscript', 'it says where the visit came from, as a short plain name', r.data.from);
r = await req('POST', `/api/admin/telegrams/${encodeURIComponent(item.key)}/read`, { body: { read: true } });
check(r.status === 200 && r.data.read === true, 'it can be marked read');
r = await req('GET', '/api/admin/telegrams/tg:not-a-key');
check(r.status === 404, 'a made-up key finds nothing');
r = await req('DELETE', `/api/admin/telegrams/${encodeURIComponent(item.key)}`);
check(r.status === 200, 'it can be deleted');
check(!(await req('GET', '/api/admin/telegrams')).data.items.some((t) => t.key === item.key), '...and it is gone');

// ---- put things back, then sign out
r = await req('PUT', '/api/admin/settings', { body: before });
check(r.status === 200, 'the settings found at the start are restored');
r = await req('PUT', '/api/admin/stats', { body: { months: statsBefore.months } });
check(r.status === 200 && JSON.stringify(r.data.months) === JSON.stringify(statsBefore.months), 'the form’s numbers are put back as found', JSON.stringify(r.data));
if (!r.data.status?.vcard?.live) check((await fetch(`${BASE}/stefano-doko.vcf`)).status === 404, 'with the card off there is no card to download');
r = await req('POST', '/api/admin/logout');
check(r.status === 200 && !cookie, 'signing out drops the cookie');
r = await req('GET', '/api/admin/settings');
check(r.status === 401, 'after signing out the settings are closed', r.status);

console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
