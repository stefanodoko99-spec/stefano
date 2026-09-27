// Renders the @sdesign.al launch set: every slide of posts.html to
// post<P>-<n>.png (1080x1350; post 5 is the "Menuja" carousel, ../flyer/),
// the highlight covers of brand/final/logo/highlights to PNG
// (brand/final/export/instagram/highlights/), and highlights.png, the covers
// as the profile shows them, in the order to add them.
// usage: node social/render.mjs
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const dir = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));
const brand = path.join(dir, '..', 'brand', 'final');
// the highlights for @sdesign.al, in order: the file, and the name Instagram prints under it
const HIGHLIGHTS = [['puna', 'Punët'], ['faqe', 'Faqe'], ['dizajn', 'Dizajn'], ['marketing', 'Marketing'], ['cmimet', 'Çmimet'], ['kontakt', 'Kontakt']];

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: process.env.CHROME || (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : 'C:/Program Files/Google/Chrome/Application/chrome.exe'),
  args: ['--allow-file-access-from-files'],
});
const page = await browser.newPage();

// the posts
await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.join(dir, 'posts.html')).href, { waitUntil: 'networkidle0' });
// the heads are fitted to their tracks once the fonts are in (../flyer/sheet.js)
await page.waitForFunction(() => document.documentElement.dataset.fitted === '1');
const count = {};
for (const el of await page.$$('.slide')) {
  const post = await el.evaluate((s) => s.dataset.post);
  count[post] = (count[post] || 0) + 1;
  // content that runs into the foot rule means the slide is overfull
  const fit = await el.evaluate((s) => {
    const foot = s.querySelector('.foot');
    return { gap: Math.round(foot.getBoundingClientRect().top - foot.previousElementSibling.getBoundingClientRect().bottom), over: s.scrollHeight > s.clientHeight };
  });
  const file = `post${post}-${count[post]}.png`;
  console.log(file, fit);
  await el.screenshot({ path: path.join(dir, file) });
}

// the highlight covers, icon only: Instagram prints the name
const wrap = path.join(brand, '_wrap.html');
await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
for (const f of fs.readdirSync(path.join(brand, 'logo', 'highlights')).filter((f) => f.endsWith('.svg'))) {
  fs.writeFileSync(wrap, `<!doctype html><style>*{margin:0}img{display:block;width:1080px;height:1920px}</style><img src="logo/highlights/${f}">`);
  await page.goto(pathToFileURL(wrap).href, { waitUntil: 'load' });
  const out = path.join(brand, 'export', 'instagram', 'highlights', f.replace('.svg', '.png'));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1080, height: 1920 } });
}
fs.rmSync(wrap);

// the covers as the profile shows them: the middle of each, in a circle, with its name
const circles = HIGHLIGHTS.map(([f, name]) => `<figure><img src="../brand/final/logo/highlights/${f}.svg"><figcaption>${name}</figcaption></figure>`).join('');
const strip = path.join(dir, '_strip.html');
fs.writeFileSync(strip, `<!doctype html><meta charset="utf-8"><style>
@font-face { font-family: 'Inter'; src: url('../public/fonts/Inter-VF-latin.woff2') format('woff2'); font-weight: 100 900; }
* { margin: 0; } body { background: #fff; font: 400 26px/1.2 Inter, sans-serif; color: #141414; }
main { display: flex; gap: 40px; padding: 40px 48px 36px; width: max-content; }
figure { display: grid; justify-items: center; gap: 16px; }
img { width: 190px; height: 190px; object-fit: cover; object-position: 50% 50%; border-radius: 50%; box-shadow: 0 0 0 5px #fff, 0 0 0 7px #dbdbdb; }
</style><main>${circles}</main>`);
await page.setViewport({ width: 1600, height: 400, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(strip).href, { waitUntil: 'networkidle0' });
await page.evaluate(() => document.fonts.ready);
await (await page.$('main')).screenshot({ path: path.join(dir, 'highlights.png') });
fs.rmSync(strip);

await browser.close();
console.log(`wrote ${Object.values(count).reduce((a, b) => a + b, 0)} slides, the highlight covers and highlights.png`);
